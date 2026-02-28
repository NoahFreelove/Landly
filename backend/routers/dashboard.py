from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, Unit, Payment, KlarnaDebt, Market, Notification
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

    # Gentrification index: average rent as percentage of max possible rent
    all_units = db.query(Unit).all()
    avg_rent = sum(u.monthly_rent_usd for u in all_units) / len(all_units) if all_units else 0
    gentrification_index = min(100, (avg_rent / 4100) * 100)  # 4100 is max rent (Park & Pine)

    return {
        "user": UserResponse.model_validate(user),
        "unit": UnitResponse.model_validate(unit) if unit else None,
        "recent_payments": [PaymentResponse.model_validate(p) for p in payments],
        "klarna_debts": [KlarnaDebtResponse.model_validate(d) for d in klarna_debts],
        "markets": [MarketResponse.model_validate(m) for m in markets],
        "notifications": [NotificationResponse.model_validate(n) for n in notifications],
        "eviction_status": eviction_status,
        "gentrification_index": round(gentrification_index, 1),
        "credit_score": 300 + int(user.social_credit_score * 0.55),
        "interest_rate": 5.5 + max(0, (700 - user.social_credit_score) * 0.02),
        "total_debt": round(total_debt, 2),
        "debt_breakdown": {
            "rent": round(rent_total, 2),
            "late_fees": round(late_fee_total, 2),
            "klarna": round(klarna_remaining, 2),
            "interest": round(interest_total, 2),
        }
    }
