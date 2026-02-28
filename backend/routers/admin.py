from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, Payment, Market, SimulationState, Notification
from schemas import SimulationStateResponse, AdvanceTimeResponse
from datetime import timedelta, datetime, timezone
import random

router = APIRouter(prefix="/api/admin", tags=["admin"])

PASSIVE_AGGRESSIVE_NOTICES = [
    ("Breathing Analysis", "Your nocturnal breathing exceeded acceptable decibel levels. Consider breathing more quietly.", "violation"),
    ("Hallway Usage", "Corridor sensors detected you spent 4.7 minutes in the hallway. Optimal transit time is 45 seconds.", "warning"),
    ("Water Consumption", "Your water usage is 12% above building average. Consider being less hydrated.", "general"),
    ("Noise Complaint", "An automated noise complaint has been filed against your unit. Source: existing.", "violation"),
    ("Loyalty Check", "You have not submitted a positive building review in 7 days. This has been noted.", "general"),
    ("Temperature Alert", "Your thermostat was set 2 degrees above recommended. Energy surcharge applied.", "warning"),
    ("Social Credit Notice", "Your proximity to low-scored tenants has been recorded. Choose associations wisely.", "warning"),
    ("Rent Optimization", "Based on market analysis, your rent has been optimally adjusted upward.", "general"),
    ("Maintenance Update", "Your maintenance request has been received. It will be addressed within the maximum legal timeframe.", "maintenance"),
    ("Compliance Reminder", "This is your daily reminder that compliance is comfort. Non-compliance is discomfort.", "general"),
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
            notice = random.choice(PASSIVE_AGGRESSIVE_NOTICES)
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
    pending = db.query(Payment).filter(Payment.status == "pending").all()
    for p in pending:
        if p.due_date and p.due_date <= datetime.now(timezone.utc):
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
            events.append(f"{u.citizen_id} flagged for eviction (debt: ${round(total_debt, 2)})")

        # Decrease social credit for overdue payments
        if user_overdue:
            penalty = len(user_overdue) * 25
            u.social_credit_score = max(0, u.social_credit_score - penalty)
            events.append(f"{u.citizen_id} social credit -{penalty}")

    # Generate notifications for all users
    for u in users:
        notice = random.choice(PASSIVE_AGGRESSIVE_NOTICES)
        notif = Notification(user_id=u.id, title=notice[0], message=notice[1], category=notice[2])
        db.add(notif)
    events.append("Monthly notifications generated for all tenants")

    # Resolve some markets randomly
    active_markets = db.query(Market).filter(Market.is_active == True).all()
    for m in active_markets:
        if random.random() > 0.7:
            m.is_active = False
            events.append(f"Market resolved: {m.question}")

    db.commit()
    return AdvanceTimeResponse(previous_date=previous, new_date=state.current_date, events=events)
