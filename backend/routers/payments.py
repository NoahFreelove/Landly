from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from database import get_db
from models import User, Payment, KlarnaDebt, Unit, SimulationState
from schemas import (PaymentRequest, PaymentSummaryResponse, PaymentResponse, KlarnaDebtResponse,
                     EvictionStatusResponse, DebtBreakdown, LumpSumRequest, RentPlanSelectRequest,
                     AutoPayToggleRequest, PointsRedeemRequest, ReferralRequest)
from services.auth import get_current_user

PLAN_CONFIG = {
    "standard": {"months": 3, "base_apr": 0.18, "label": "Standard"},
    "flexible": {"months": 6, "base_apr": 0.24, "label": "Flexible"},
    "freedom":  {"months": 12, "base_apr": 0.35, "label": "Freedom"},
}
PORTFOLIO_RISK_ADJUSTMENT = 0.02  # +2% per active plan


def _effective_apr(base_apr: float, active_plan_count: int) -> float:
    """Each active plan adds +2% to the rate."""
    return base_apr + (active_plan_count * PORTFOLIO_RISK_ADJUSTMENT)


router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.get("/summary", response_model=PaymentSummaryResponse)
def payment_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payments = db.query(Payment).filter(Payment.user_id == user.id).order_by(Payment.due_date.desc()).all()
    klarna = db.query(KlarnaDebt).filter(KlarnaDebt.user_id == user.id).all()

    pending_payments = [p for p in payments if p.status in ("pending", "overdue")]
    total_owed = sum(p.amount + p.accrued_interest for p in pending_payments)
    total_owed += sum((d.total_amount / d.installments) * (d.installments - d.installments_paid) for d in klarna if d.status == "active")

    overdue = [p for p in payments if p.status == "overdue"]
    next_due = min((p.due_date for p in pending_payments), default=None)

    rent_total = sum(p.amount + p.accrued_interest for p in pending_payments if p.payment_type == "rent")
    late_fee_total = sum(p.amount + p.accrued_interest for p in pending_payments if p.payment_type == "late_fee")
    interest_total = sum(p.accrued_interest for p in pending_payments)
    klarna_total = sum((d.total_amount / d.installments) * (d.installments - d.installments_paid) for d in klarna if d.status == "active")

    return PaymentSummaryResponse(
        total_owed=round(total_owed, 2),
        next_due_date=next_due,
        overdue_count=len(overdue),
        payments=[PaymentResponse.model_validate(p) for p in payments],
        klarna_debts=[KlarnaDebtResponse.model_validate(d) for d in klarna],
        debt_breakdown=DebtBreakdown(
            rent=round(rent_total, 2),
            late_fees=round(late_fee_total, 2),
            klarna=round(klarna_total, 2),
            interest=round(interest_total, 2)
        )
    )

@router.post("/pay")
def make_payment(req: PaymentRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == req.payment_id, Payment.user_id == user.id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status == "paid":
        raise HTTPException(status_code=400, detail="Payment already made")

    payment.status = "paid"
    # Improve social credit for on-time payment
    user.social_credit_score = min(1000, user.social_credit_score + 10)
    db.commit()
    return {"message": "Payment processed", "new_social_credit": user.social_credit_score}

@router.post("/lump-sum")
def lump_sum_payment(req: LumpSumRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    remaining = req.amount
    items_paid = 0

    # Query overdue payments first (sorted by due_date ASC), then pending payments (sorted by due_date ASC)
    overdue_payments = db.query(Payment).filter(
        Payment.user_id == user.id, Payment.status == "overdue"
    ).order_by(Payment.due_date.asc()).all()

    pending_payments = db.query(Payment).filter(
        Payment.user_id == user.id, Payment.status == "pending"
    ).order_by(Payment.due_date.asc()).all()

    all_payments = overdue_payments + pending_payments

    for payment in all_payments:
        if remaining <= 0:
            break
        payment_total = payment.amount + payment.accrued_interest
        if remaining >= payment_total:
            payment.status = "paid"
            remaining -= payment_total
            items_paid += 1
            user.social_credit_score = min(1000, user.social_credit_score + 10)
        else:
            # Partial payment: reduce the payment amount by what we can cover
            payment.amount -= remaining
            remaining = 0

    # Apply remaining to active Klarna debts
    if remaining > 0:
        klarna_debts = db.query(KlarnaDebt).filter(
            KlarnaDebt.user_id == user.id, KlarnaDebt.status == "active"
        ).all()

        for debt in klarna_debts:
            if remaining <= 0:
                break
            installment_amount = debt.total_amount / debt.installments
            remaining_installments = debt.installments - debt.installments_paid

            for _ in range(remaining_installments):
                if remaining >= installment_amount:
                    remaining -= installment_amount
                    debt.installments_paid += 1
                    items_paid += 1
                    user.social_credit_score = min(1000, user.social_credit_score + 10)
                else:
                    break

            if debt.installments_paid >= debt.installments:
                debt.status = "completed"

    amount_applied = req.amount - remaining
    db.commit()

    return {
        "message": "Payment applied successfully",
        "amount_applied": round(amount_applied, 2),
        "items_paid": items_paid,
        "new_social_credit": user.social_credit_score
    }

@router.get("/eviction-status", response_model=EvictionStatusResponse)
def eviction_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    overdue = db.query(Payment).filter(Payment.user_id == user.id, Payment.status == "overdue").all()
    total_owed = sum(p.amount + p.accrued_interest for p in overdue)

    return EvictionStatusResponse(
        is_pending=user.status == "eviction_pending",
        deadline="30 days" if user.status == "eviction_pending" else None,
        reason="Outstanding debt exceeds threshold" if total_owed > 1000 else None,
        amount_owed=round(total_owed, 2)
    )

@router.post("/select-rent-plan")
def select_rent_plan(
    req: RentPlanSelectRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.plan_type not in PLAN_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid plan type")

    if not user.unit_id:
        raise HTTPException(status_code=400, detail="No unit assigned")

    unit = db.query(Unit).filter(Unit.id == user.unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    config = PLAN_CONFIG[req.plan_type]

    # Count active rent plans for portfolio risk adjustment
    active_plans = db.query(KlarnaDebt).filter(
        KlarnaDebt.user_id == user.id,
        KlarnaDebt.status == "active",
        KlarnaDebt.rent_month.isnot(None)
    ).count()

    apr = _effective_apr(config["base_apr"], active_plans)

    # Determine rent month (use simulation date)
    sim = db.query(SimulationState).first()
    rent_month = sim.current_date.strftime("%Y-%m") if sim else datetime.now(timezone.utc).strftime("%Y-%m")

    # Check if a plan already exists for this month
    existing = db.query(KlarnaDebt).filter(
        KlarnaDebt.user_id == user.id,
        KlarnaDebt.rent_month == rent_month
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Plan already exists for {rent_month}")

    debt = KlarnaDebt(
        user_id=user.id,
        item_name=f"{rent_month} Rent — {unit.name}",
        total_amount=unit.monthly_rent_usd,
        installments=config["months"],
        installments_paid=0,
        status="active",
        rent_month=rent_month,
        plan_type=req.plan_type,
        apr=round(apr, 4),
    )
    db.add(debt)

    # Update user's default plan type
    user.default_plan_type = req.plan_type
    db.commit()

    installment_amount = unit.monthly_rent_usd / config["months"]
    return {
        "message": f"{config['label']} plan created for {rent_month}",
        "plan_type": req.plan_type,
        "monthly_rent": unit.monthly_rent_usd,
        "installments": config["months"],
        "installment_amount": round(installment_amount, 2),
        "apr": round(apr * 100, 1),
        "active_plans": active_plans + 1,
    }

@router.get("/active-plans")
def get_active_plans(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plans = db.query(KlarnaDebt).filter(
        KlarnaDebt.user_id == user.id,
        KlarnaDebt.status.in_(["active", "overdue"]),
    ).order_by(KlarnaDebt.created_at.asc()).all()

    result = []
    for p in plans:
        installment_amount = p.total_amount / p.installments
        remaining = p.installments - p.installments_paid
        result.append({
            "id": p.id,
            "item_name": p.item_name,
            "rent_month": p.rent_month,
            "plan_type": p.plan_type,
            "total_amount": p.total_amount,
            "installments": p.installments,
            "installments_paid": p.installments_paid,
            "installment_amount": round(installment_amount, 2),
            "remaining_balance": round(installment_amount * remaining, 2),
            "apr": p.apr,
            "status": p.status,
            "next_due_amount": round(installment_amount, 2),
        })

    this_month_total = sum(p["installment_amount"] for p in result)

    return {
        "plans": result,
        "active_count": len(result),
        "this_month_total": round(this_month_total, 2),
    }
