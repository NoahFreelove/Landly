from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Payment, KlarnaDebt
from schemas import PaymentRequest, PaymentSummaryResponse, PaymentResponse, KlarnaDebtResponse, EvictionStatusResponse
from services.auth import get_current_user

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

    return PaymentSummaryResponse(
        total_owed=round(total_owed, 2),
        next_due_date=next_due,
        overdue_count=len(overdue),
        payments=[PaymentResponse.model_validate(p) for p in payments],
        klarna_debts=[KlarnaDebtResponse.model_validate(d) for d in klarna]
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
