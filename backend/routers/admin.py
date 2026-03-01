from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, Payment, Market, SimulationState, Notification, KlarnaDebt, Unit
from schemas import SimulationStateResponse, AdvanceTimeResponse
from datetime import timedelta, datetime, timezone
import random

router = APIRouter(prefix="/api/admin", tags=["admin"])

CORPORATE_NOTICES = [
    ("Noise Advisory", "Elevated noise levels were detected in your unit. A courtesy reminder has been logged to your resident file.", "violation"),
    ("Visitor Log Update", "A visitor to your unit was logged by the Smart Home system. No action required at this time.", "general"),
    ("Community Score Adjustment", "Your Community Score has been adjusted based on recent resident feedback. View your updated score in the dashboard.", "warning"),
    ("Lease Renewal Notice", "Your lease renewal assessment has been automatically initiated. Our team will be in touch with updated terms.", "general"),
    ("Maintenance Window", "Scheduled maintenance will occur in your building. Access to certain amenities may be temporarily limited.", "maintenance"),
    ("Payment Confirmation", "Your recent payment has been processed successfully. Thank you for being a valued Landly resident.", "general"),
    ("Smart Home Alert", "Your Smart Home system detected unusual activity patterns. This has been noted for your safety.", "warning"),
    ("Package Notification", "A package was received and scanned at your building's secure mailroom. Retrieval logged for your records.", "general"),
    ("Energy Usage Report", "Your energy consumption this month was 12% above building average. Consider reviewing your Smart Home settings.", "warning"),
    ("Community Event", "You're invited to this month's Resident Appreciation Mixer. Attendance is optional but noted.", "general"),
]

@router.get("/current-date", response_model=SimulationStateResponse)
def get_current_date(db: Session = Depends(get_db)):
    state = db.query(SimulationState).first()
    if not state:
        from datetime import date
        state = SimulationState(current_date=date.today(), day_number=1)
        db.add(state)
        db.commit()
    return state

@router.post("/advance-day", response_model=AdvanceTimeResponse)
def advance_day(db: Session = Depends(get_db)):
    state = db.query(SimulationState).first()
    if not state:
        from datetime import date
        state = SimulationState(current_date=date.today(), day_number=1)
        db.add(state)
        db.commit()

    previous = state.current_date
    state.current_date = state.current_date + timedelta(days=1)
    state.day_number += 1

    events = []

    # Accrue interest on overdue payments
    overdue = db.query(Payment).filter(Payment.status == "overdue").all()
    for p in overdue:
        daily_rate = p.interest_rate / 365
        p.accrued_interest += p.amount * daily_rate
        events.append(f"Interest accrued on payment #{p.id}: +${round(p.amount * daily_rate, 2)}")

    # Random notification for a random user
    if random.random() > 0.5:
        users = db.query(User).all()
        if users:
            target = random.choice(users)
            notice = random.choice(CORPORATE_NOTICES)
            notif = Notification(user_id=target.id, title=notice[0], message=notice[1], category=notice[2])
            db.add(notif)
            events.append(f"Notification sent to {target.citizen_id}: {notice[0]}")

    db.commit()
    return AdvanceTimeResponse(previous_date=previous, new_date=state.current_date, events=events)

@router.post("/advance-month", response_model=AdvanceTimeResponse)
def advance_month(db: Session = Depends(get_db)):
    state = db.query(SimulationState).first()
    if not state:
        from datetime import date
        state = SimulationState(current_date=date.today(), day_number=1)
        db.add(state)
        db.commit()

    previous = state.current_date
    state.current_date = state.current_date + timedelta(days=30)
    state.day_number += 30

    events = []

    # Process all pending payments - mark as overdue
    # Use naive UTC datetime since SQLite stores naive datetimes
    now_utc = datetime.utcnow()
    pending = db.query(Payment).filter(Payment.status == "pending").all()
    for p in pending:
        if p.due_date and p.due_date <= now_utc:
            p.status = "overdue"
            events.append(f"Payment #{p.id} marked overdue")

    # Accrue 30 days of interest on overdue payments
    overdue = db.query(Payment).filter(Payment.status == "overdue").all()
    for p in overdue:
        monthly_interest = p.amount * (p.interest_rate / 12)
        p.accrued_interest += monthly_interest
        events.append(f"Monthly interest on payment #{p.id}: +${round(monthly_interest, 2)}")

    # Update eviction status for users with high debt
    users = db.query(User).all()
    for u in users:
        user_overdue = [p for p in overdue if p.user_id == u.id]
        total_debt = sum(p.amount + p.accrued_interest for p in user_overdue)
        if total_debt > 2000 and u.status != "eviction_pending":
            u.status = "eviction_pending"
            events.append(f"{u.citizen_id} flagged for lease review (debt: ${round(total_debt, 2)})")

        # Decrease community score for overdue payments
        if user_overdue:
            penalty = len(user_overdue) * 25
            u.social_credit_score = max(0, u.social_credit_score - penalty)
            events.append(f"{u.citizen_id} Community Score -{penalty}")

    # Generate notifications for all users
    for u in users:
        notice = random.choice(CORPORATE_NOTICES)
        notif = Notification(user_id=u.id, title=notice[0], message=notice[1], category=notice[2])
        db.add(notif)
    events.append("Monthly notifications generated for all residents")

    # Resolve some markets randomly
    active_markets = db.query(Market).filter(Market.is_active == True).all()
    for m in active_markets:
        if random.random() > 0.7:
            m.is_active = False
            events.append(f"Market resolved: {m.question}")

    # Generate monthly rent plans for all housed users
    housed_users = db.query(User).filter(User.unit_id.isnot(None)).all()
    rent_month = state.current_date.strftime("%Y-%m")

    for u in housed_users:
        # Skip if plan already exists for this month
        existing = db.query(KlarnaDebt).filter(
            KlarnaDebt.user_id == u.id,
            KlarnaDebt.rent_month == rent_month
        ).first()
        if existing:
            continue

        unit = db.query(Unit).filter(Unit.id == u.unit_id).first()
        if not unit:
            continue

        plan_type = u.default_plan_type or "flexible"

        # Import plan config
        plan_configs = {
            "standard": {"months": 3, "base_apr": 0.18, "label": "Standard"},
            "flexible": {"months": 6, "base_apr": 0.24, "label": "Flexible"},
            "freedom":  {"months": 12, "base_apr": 0.35, "label": "Freedom"},
        }
        config = plan_configs.get(plan_type, plan_configs["flexible"])

        active_count = db.query(KlarnaDebt).filter(
            KlarnaDebt.user_id == u.id,
            KlarnaDebt.status == "active",
            KlarnaDebt.rent_month.isnot(None)
        ).count()

        apr = config["base_apr"] + (active_count * 0.02)

        # AutoPay users get locked into freedom (12-month) plan
        if u.autopay_enabled:
            config = plan_configs["freedom"]
            apr = config["base_apr"] + (active_count * 0.02) - 0.02  # 2% "discount"
            plan_type = "freedom"

        from datetime import timezone as tz
        debt = KlarnaDebt(
            user_id=u.id,
            item_name=f"{rent_month} Rent — {unit.name}",
            total_amount=unit.monthly_rent_usd,
            installments=config["months"],
            installments_paid=0,
            status="active",
            rent_month=rent_month,
            plan_type=plan_type,
            apr=round(apr, 4),
        )
        db.add(debt)
        events.append(f"Rent plan created for {u.citizen_id}: {rent_month} ({config['label']})")

    db.commit()
    return AdvanceTimeResponse(previous_date=previous, new_date=state.current_date, events=events)
