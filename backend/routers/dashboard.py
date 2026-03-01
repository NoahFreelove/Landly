from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, Unit, Payment, KlarnaDebt, Market, Notification, SimulationState
from schemas import UserResponse, UnitResponse, PaymentResponse, KlarnaDebtResponse, MarketResponse, NotificationResponse
from services.auth import get_current_user

router = APIRouter(prefix="/api", tags=["dashboard"])

@router.get("/dashboard")
def get_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == user.unit_id).first() if user.unit_id else None
    payments = db.query(Payment).filter(Payment.user_id == user.id).order_by(Payment.due_date.desc()).limit(10).all()
    klarna_debts = db.query(KlarnaDebt).filter(KlarnaDebt.user_id == user.id).all()
    markets = db.query(Market).filter(Market.is_active == True).all()
    notifications = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(20).all()

    overdue = db.query(Payment).filter(Payment.user_id == user.id, Payment.status == "overdue").all()
    total_overdue = sum(p.amount + p.accrued_interest for p in overdue)

    # Debt breakdown: query all pending/overdue payments (not limited to 10)
    pending_payments = db.query(Payment).filter(
        Payment.user_id == user.id,
        Payment.status.in_(["pending", "overdue"])
    ).all()
    rent_total = sum(p.amount + p.accrued_interest for p in pending_payments if p.payment_type == "rent")
    late_fee_total = sum(p.amount + p.accrued_interest for p in pending_payments if p.payment_type == "late_fee")
    interest_total = sum(p.accrued_interest for p in pending_payments)
    klarna_remaining = sum(
        (d.total_amount / d.installments) * (d.installments - d.installments_paid)
        for d in klarna_debts if d.status == "active"
    )
    total_debt = sum(p.amount + p.accrued_interest for p in pending_payments) + klarna_remaining

    eviction_status = {
        "is_pending": user.status == "eviction_pending",
        "deadline": None,
        "reason": "Outstanding balance exceeds threshold" if total_overdue > 1000 else None,
        "amount_owed": total_overdue
    }

    # Debt spiral timeline data
    active_rent_plans = db.query(KlarnaDebt).filter(
        KlarnaDebt.user_id == user.id,
        KlarnaDebt.status.in_(["active", "overdue"]),
        KlarnaDebt.rent_month.isnot(None),
    ).order_by(KlarnaDebt.created_at.asc()).all()

    spiral_plans = []
    for p in active_rent_plans:
        inst_amt = p.total_amount / p.installments
        remaining = p.installments - p.installments_paid
        spiral_plans.append({
            "id": p.id,
            "rent_month": p.rent_month,
            "plan_type": p.plan_type,
            "total_amount": p.total_amount,
            "installments": p.installments,
            "installments_paid": p.installments_paid,
            "installment_amount": round(inst_amt, 2),
            "remaining_balance": round(inst_amt * remaining, 2),
            "apr": p.apr or 0.24,
            "status": p.status,
        })

    this_month_total = sum(p["installment_amount"] for p in spiral_plans)

    # Projected debt-free date
    max_remaining = max((p["installments"] - p["installments_paid"] for p in spiral_plans), default=0)
    sim = db.query(SimulationState).first()
    current_date = sim.current_date if sim else datetime.now(timezone.utc).date()
    # Add max_remaining months
    projected_month = current_date.month + max_remaining
    projected_year = current_date.year + (projected_month - 1) // 12
    projected_month = ((projected_month - 1) % 12) + 1
    projected_debt_free = current_date.replace(year=projected_year, month=projected_month)

    return {
        "user": UserResponse.model_validate(user),
        "unit": UnitResponse.model_validate(unit) if unit else None,
        "recent_payments": [PaymentResponse.model_validate(p) for p in payments],
        "klarna_debts": [KlarnaDebtResponse.model_validate(d) for d in klarna_debts],
        "markets": [MarketResponse.model_validate(m) for m in markets],
        "notifications": [NotificationResponse.model_validate(n) for n in notifications],
        "eviction_status": eviction_status,
        "credit_score": 300 + int(user.social_credit_score * 0.55),
        "interest_rate": 5.5 + max(0, (700 - user.social_credit_score) * 0.02),
        "total_debt": round(total_debt, 2),
        "debt_breakdown": {
            "rent": round(rent_total, 2),
            "late_fees": round(late_fee_total, 2),
            "klarna": round(klarna_remaining, 2),
            "interest": round(interest_total, 2),
        },
        "debt_spiral": {
            "plans": spiral_plans,
            "active_count": len(spiral_plans),
            "this_month_total": round(this_month_total, 2),
            "projected_debt_free": projected_debt_free.isoformat(),
        },
        "autopay_enabled": bool(user.autopay_enabled),
        "landly_points": user.landly_points,
        "referral_code": user.referral_code,
    }
