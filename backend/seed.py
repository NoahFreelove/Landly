"""Populate the database with realistic test data."""

from datetime import datetime, timedelta, timezone

from passlib.hash import bcrypt

from database import engine, SessionLocal, Base
from models import (
    User, Unit, Payment, KlarnaDebt,
    Market, MarketBet, ChatMessage,
    SimulationState, Notification, TenantRating,
)


def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # ── Units ──────────────────────────────────────────────
    units = [
        Unit(
            name="The Meridian 4B",
            sector="Midtown East",
            monthly_rent_usd=2450.00,
            sqft=780,
            bedrooms=1,
            bathrooms=1,
            floor=4,
            pet_policy="Pets Welcome",
            parking="$75/mo",
            laundry="In-Unit",
            year_built=2019,
            smart_home=True,
            noise_monitoring=True,
            community_score_required=650,
            is_available=False,
        ),
        Unit(
            name="Apex Living 12F",
            sector="Financial District",
            monthly_rent_usd=3200.00,
            sqft=950,
            bedrooms=2,
            bathrooms=1,
            floor=12,
            pet_policy="No Pets",
            parking="Included",
            laundry="In-Unit",
            year_built=2022,
            smart_home=True,
            noise_monitoring=True,
            community_score_required=700,
            is_available=True,
        ),
        Unit(
            name="Haven Studios 2A",
            sector="Williamsburg",
            monthly_rent_usd=1850.00,
            sqft=520,
            bedrooms=0,
            bathrooms=1,
            floor=2,
            pet_policy="No Pets",
            parking="None",
            laundry="Shared",
            year_built=2015,
            smart_home=True,
            noise_monitoring=True,
            community_score_required=580,
            is_available=True,
        ),
        Unit(
            name="Park & Pine 7C",
            sector="Upper West Side",
            monthly_rent_usd=4100.00,
            sqft=1200,
            bedrooms=2,
            bathrooms=2,
            floor=7,
            pet_policy="Pets Welcome",
            parking="Included",
            laundry="In-Unit",
            year_built=2021,
            smart_home=True,
            noise_monitoring=True,
            community_score_required=720,
            is_available=True,
        ),
        Unit(
            name="Greenline Residences 15D",
            sector="Long Island City",
            monthly_rent_usd=2800.00,
            sqft=880,
            bedrooms=1,
            bathrooms=1,
            floor=15,
            pet_policy="Pets Welcome",
            parking="$75/mo",
            laundry="In-Unit",
            year_built=2023,
            smart_home=True,
            noise_monitoring=True,
            community_score_required=660,
            is_available=True,
        ),
        Unit(
            name="The Elm 3B",
            sector="Bushwick",
            monthly_rent_usd=1450.00,
            sqft=600,
            bedrooms=1,
            bathrooms=1,
            floor=3,
            pet_policy="No Pets",
            parking="None",
            laundry="Shared",
            year_built=2010,
            smart_home=False,
            noise_monitoring=True,
            community_score_required=520,
            is_available=True,
        ),
    ]
    db.add_all(units)
    db.flush()

    # ── Users ──────────────────────────────────────────────
    password = bcrypt.hash("citizen123")
    users = [
        User(
            citizen_id="RES-7291",
            name="Alex Mercer",
            password_hash=password,
            social_credit_score=620,
            trust_score=0.72,
            status="warning",
            tier="silver",
            unit_id=units[0].id,
        ),
        User(
            citizen_id="RES-0042",
            name="Jordan Blake",
            password_hash=password,
            social_credit_score=340,
            trust_score=0.31,
            status="probation",
            tier="bronze",
            unit_id=units[5].id,
        ),
        User(
            citizen_id="RES-9999",
            name="Admin User",
            password_hash=bcrypt.hash("admin"),
            social_credit_score=999,
            trust_score=1.0,
            status="compliant",
            tier="platinum",
            unit_id=units[3].id,
        ),
    ]
    db.add_all(users)
    db.flush()

    now = datetime.now(timezone.utc)

    # ── Payments ───────────────────────────────────────────
    payments = [
        Payment(
            user_id=users[0].id,
            amount=2450.00,
            payment_type="rent",
            status="overdue",
            due_date=now - timedelta(days=5),
            interest_rate=0.18,
            accrued_interest=43.50,
        ),
        Payment(
            user_id=users[0].id,
            amount=75.00,
            payment_type="late_fee",
            status="pending",
            due_date=now + timedelta(days=2),
            interest_rate=0.0,
            accrued_interest=0.0,
        ),
        Payment(
            user_id=users[0].id,
            amount=2450.00,
            payment_type="rent",
            status="paid",
            due_date=now - timedelta(days=35),
            interest_rate=0.0,
            accrued_interest=0.0,
        ),
        Payment(
            user_id=users[1].id,
            amount=1450.00,
            payment_type="rent",
            status="overdue",
            due_date=now - timedelta(days=12),
            interest_rate=0.24,
            accrued_interest=62.40,
        ),
        Payment(
            user_id=users[1].id,
            amount=1450.00,
            payment_type="rent",
            status="overdue",
            due_date=now - timedelta(days=42),
            interest_rate=0.24,
            accrued_interest=124.80,
        ),
    ]
    db.add_all(payments)

    # ── Klarna Debts ───────────────────────────────────────
    klarna = [
        KlarnaDebt(
            user_id=users[0].id,
            item_name="Security Deposit — The Meridian 4B",
            total_amount=4900.00,
            installments=6,
            installments_paid=2,
            status="active",
        ),
        KlarnaDebt(
            user_id=users[0].id,
            item_name="Smart Home Setup Fee",
            total_amount=299.99,
            installments=4,
            installments_paid=0,
            status="overdue",
        ),
        KlarnaDebt(
            user_id=users[1].id,
            item_name="Security Deposit — The Elm 3B",
            total_amount=2900.00,
            installments=4,
            installments_paid=2,
            status="active",
        ),
    ]
    db.add_all(klarna)

    # ── Markets (eviction-focused) ────────────────────────
    markets = [
        Market(
            question="Will Alex Mercer (RES-7291) be evicted by end of quarter?",
            category="eviction",
            yes_price=0.42,
            no_price=0.58,
            volume=1823,
            is_active=True,
        ),
        Market(
            question="Will Jordan Blake (RES-0042) miss 3+ consecutive payments?",
            category="eviction",
            yes_price=0.71,
            no_price=0.29,
            volume=3402,
            is_active=True,
        ),
        Market(
            question="Will The Elm 3B have a new tenant by March?",
            category="eviction",
            yes_price=0.35,
            no_price=0.65,
            volume=890,
            is_active=True,
        ),
        Market(
            question="Will average Community Score drop below 500 this cycle?",
            category="eviction",
            yes_price=0.28,
            no_price=0.72,
            volume=2190,
            is_active=True,
        ),
        Market(
            question="Will any resident in Financial District default on Klarna?",
            category="eviction",
            yes_price=0.55,
            no_price=0.45,
            volume=1567,
            is_active=True,
        ),
    ]
    db.add_all(markets)
    db.flush()

    # ── Market Bets ────────────────────────────────────────
    bets = [
        MarketBet(user_id=users[0].id, market_id=markets[0].id, position="yes", amount=50.0),
        MarketBet(user_id=users[0].id, market_id=markets[1].id, position="no", amount=25.0),
        MarketBet(user_id=users[1].id, market_id=markets[3].id, position="yes", amount=10.0),
    ]
    db.add_all(bets)

    # ── Chat Messages ─────────────────────────────────────
    messages = [
        ChatMessage(
            user_id=users[0].id,
            role="user",
            content="I'd like to discuss my rent increase. It seems quite high compared to last year.",
            negotiation_id="neg-001",
            created_at=now - timedelta(hours=2),
        ),
        ChatMessage(
            user_id=users[0].id,
            role="assistant",
            content="Thank you for reaching out, Alex. Your rent adjustment reflects current market conditions in Midtown East and your Community Score of 620. Residents with scores above 750 may qualify for preferred rates. I'd be happy to discuss options for improving your standing.",
            negotiation_id="neg-001",
            created_at=now - timedelta(hours=2, minutes=-1),
        ),
        ChatMessage(
            user_id=users[0].id,
            role="user",
            content="What can I do to improve my score?",
            negotiation_id="neg-001",
            created_at=now - timedelta(hours=1),
        ),
        ChatMessage(
            user_id=users[0].id,
            role="assistant",
            content="Great question! Here are some steps: (1) Resolve your outstanding Klarna balance of $4,899.99. (2) Maintain noise levels within community guidelines for 14 consecutive days. (3) Enable all Smart Home features for enhanced community integration. Your participation helps build a better living environment for everyone.",
            negotiation_id="neg-001",
            created_at=now - timedelta(hours=1, minutes=-1),
        ),
    ]
    db.add_all(messages)

    # ── Simulation State ─────────────────────────────────
    sim_state = SimulationState(
        id=1,
        current_date=now.date(),
        day_number=1,
    )
    db.add(sim_state)

    # ── Notifications (corporate tone) ────────────────────
    notifications = [
        # For RES-7291 (users[0])
        Notification(
            user_id=users[0].id,
            title="Payment Processed",
            message="Your rent payment has been processed. Thank you for being a valued resident.",
            category="general",
        ),
        Notification(
            user_id=users[0].id,
            title="Community Score Update",
            message="Your Community Score has been updated based on recent activity. View details in your dashboard.",
            category="warning",
        ),
        Notification(
            user_id=users[0].id,
            title="Noise Advisory",
            message="Noise levels in your unit exceeded community guidelines at 3:47 AM. A courtesy reminder has been logged.",
            category="violation",
        ),
        Notification(
            user_id=users[0].id,
            title="Visitor Logged",
            message="Your recent visitor was logged by the Smart Home system. No action required at this time.",
            category="general",
        ),
        Notification(
            user_id=users[0].id,
            title="Maintenance Scheduled",
            message="A maintenance request has been received. Our team will respond within the standard service window.",
            category="maintenance",
        ),
        Notification(
            user_id=users[0].id,
            title="Payment Reminder",
            message="We noticed your payment was 3 days late. A small convenience fee has been applied to help you stay on track.",
            category="warning",
        ),
        # For RES-0042 (users[1])
        Notification(
            user_id=users[1].id,
            title="Lease Review",
            message="Your lease renewal assessment has been automatically initiated. We look forward to continuing our partnership.",
            category="warning",
        ),
        Notification(
            user_id=users[1].id,
            title="Community Guidelines",
            message="A reminder that quiet hours are 10 PM – 7 AM. Our noise monitoring system helps ensure a comfortable environment for everyone.",
            category="violation",
        ),
    ]
    db.add_all(notifications)

    db.commit()
    db.close()

    print("Database seeded successfully.")
    print(f"  Users:          {len(users)}")
    print(f"  Units:          {len(units)}")
    print(f"  Payments:       {len(payments)}")
    print(f"  Klarna:         {len(klarna)}")
    print(f"  Markets:        {len(markets)}")
    print(f"  Bets:           {len(bets)}")
    print(f"  Messages:       {len(messages)}")
    print(f"  Notifications:  {len(notifications)}")
    print(f"  SimulationState: 1")
    print()
    print("Test credentials:")
    print("  RES-7291 / citizen123  (Plus tier, warning status)")
    print("  RES-0042 / citizen123  (Standard tier, probation)")
    print("  RES-9999 / admin       (Elite tier, admin)")


if __name__ == "__main__":
    seed()
