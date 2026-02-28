"""Populate the database with dystopian test data."""

from datetime import datetime, timedelta, timezone

from passlib.hash import bcrypt

from database import engine, SessionLocal, Base
from models import (
    User, Unit, Payment, KlarnaDebt,
    Market, MarketBet, ChatMessage, ResourceMetric,
)


def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # ── Units ──────────────────────────────────────────────
    units = [
        Unit(
            name="Pod-7X Alpha",
            sector="North Quadrant",
            level=7,
            weekly_rent_credits=120,
            monthly_rent_usd=1450.00,
            radiation_level=0.3,
            altitude=42,
            smart_lock_status="locked",
            oxygen_quality=94.2,
            is_available=False,
        ),
        Unit(
            name="Cell-12B Omega",
            sector="East Industrial",
            level=12,
            weekly_rent_credits=85,
            monthly_rent_usd=980.00,
            radiation_level=1.7,
            altitude=78,
            smart_lock_status="locked",
            oxygen_quality=87.5,
            is_available=True,
        ),
        Unit(
            name="Hab-3F Sigma",
            sector="Central Spire",
            level=3,
            weekly_rent_credits=200,
            monthly_rent_usd=2400.00,
            radiation_level=0.1,
            altitude=18,
            smart_lock_status="unlocked",
            oxygen_quality=98.1,
            is_available=True,
        ),
        Unit(
            name="Bunker-9 Delta",
            sector="South Wasteland",
            level=-2,
            weekly_rent_credits=45,
            monthly_rent_usd=520.00,
            radiation_level=4.2,
            altitude=-12,
            smart_lock_status="override",
            oxygen_quality=72.3,
            is_available=True,
        ),
        Unit(
            name="Suite-1A Platinum",
            sector="Sky District",
            level=50,
            weekly_rent_credits=500,
            monthly_rent_usd=6200.00,
            radiation_level=0.0,
            altitude=310,
            smart_lock_status="locked",
            oxygen_quality=99.8,
            is_available=True,
        ),
        Unit(
            name="Stack-22 Gamma",
            sector="West Corridor",
            level=22,
            weekly_rent_credits=95,
            monthly_rent_usd=1100.00,
            radiation_level=0.8,
            altitude=140,
            smart_lock_status="locked",
            oxygen_quality=91.0,
            is_available=True,
        ),
    ]
    db.add_all(units)
    db.flush()

    # ── Users ──────────────────────────────────────────────
    password = bcrypt.hash("citizen123")
    users = [
        User(
            citizen_id="CIT-7291",
            name="Alex Mercer",
            password_hash=password,
            social_credit_score=620,
            trust_score=0.72,
            status="warning",
            tier="silver",
            unit_id=units[0].id,
        ),
        User(
            citizen_id="CIT-0042",
            name="Jordan Blake",
            password_hash=password,
            social_credit_score=340,
            trust_score=0.31,
            status="probation",
            tier="bronze",
            unit_id=units[3].id,
        ),
        User(
            citizen_id="CIT-9999",
            name="Admin Overlord",
            password_hash=bcrypt.hash("admin"),
            social_credit_score=999,
            trust_score=1.0,
            status="compliant",
            tier="platinum",
            unit_id=units[4].id,
        ),
    ]
    db.add_all(users)
    db.flush()

    now = datetime.now(timezone.utc)

    # ── Payments ───────────────────────────────────────────
    payments = [
        Payment(
            user_id=users[0].id,
            amount=1450.00,
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
            amount=1450.00,
            payment_type="rent",
            status="paid",
            due_date=now - timedelta(days=35),
            interest_rate=0.0,
            accrued_interest=0.0,
        ),
        Payment(
            user_id=users[1].id,
            amount=520.00,
            payment_type="rent",
            status="overdue",
            due_date=now - timedelta(days=12),
            interest_rate=0.24,
            accrued_interest=62.40,
        ),
        Payment(
            user_id=users[1].id,
            amount=520.00,
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
            item_name="Smart Lock Premium Upgrade",
            total_amount=299.99,
            installments=4,
            installments_paid=1,
            status="active",
        ),
        KlarnaDebt(
            user_id=users[0].id,
            item_name="Radiation Shield Film",
            total_amount=149.99,
            installments=4,
            installments_paid=0,
            status="overdue",
        ),
        KlarnaDebt(
            user_id=users[1].id,
            item_name="Emergency Oxygen Canister (6-pack)",
            total_amount=89.99,
            installments=4,
            installments_paid=2,
            status="active",
        ),
    ]
    db.add_all(klarna)

    # ── Markets ────────────────────────────────────────────
    markets = [
        Market(
            question="Will sector-wide rent increase exceed 15% this quarter?",
            category="rent",
            yes_price=0.72,
            no_price=0.28,
            volume=4823,
            is_active=True,
        ),
        Market(
            question="Will oxygen quality drop below 85% in North Quadrant?",
            category="resources",
            yes_price=0.45,
            no_price=0.55,
            volume=2190,
            is_active=True,
        ),
        Market(
            question="Will smart lock override affect 10+ units this month?",
            category="security",
            yes_price=0.61,
            no_price=0.39,
            volume=1567,
            is_active=True,
        ),
        Market(
            question="Will eviction rate exceed 8% by end of cycle?",
            category="housing",
            yes_price=0.38,
            no_price=0.62,
            volume=3402,
            is_active=True,
        ),
        Market(
            question="Will Klarna default rate trigger collective penalty?",
            category="debt",
            yes_price=0.55,
            no_price=0.45,
            volume=890,
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
            content="I'd like to discuss my rent increase. It seems unreasonable.",
            negotiation_id="neg-001",
            created_at=now - timedelta(hours=2),
        ),
        ChatMessage(
            user_id=users[0].id,
            role="assistant",
            content="Your rent adjustment reflects current market conditions and your social credit standing of 620. Citizens with scores above 750 qualify for a 5% reduction. I suggest improving your compliance metrics. You have 2 negotiation credits remaining this cycle.",
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
            content="Recommended actions: (1) Settle outstanding Klarna balance of $374.98. (2) Maintain noise levels below threshold for 14 consecutive days. (3) Participate in the voluntary surveillance opt-in program for +50 credit points. Remember: compliance is comfort.",
            negotiation_id="neg-001",
            created_at=now - timedelta(hours=1, minutes=-1),
        ),
    ]
    db.add_all(messages)

    # ── Resource Metrics (for unit Pod-7X Alpha) ──────────
    resources = [
        ResourceMetric(
            unit_id=units[0].id,
            metric_type="oxygen",
            current_value=94.2,
            max_value=100.0,
            status="normal",
            trend="down",
        ),
        ResourceMetric(
            unit_id=units[0].id,
            metric_type="water",
            current_value=67.0,
            max_value=100.0,
            status="warning",
            trend="down",
        ),
        ResourceMetric(
            unit_id=units[0].id,
            metric_type="power",
            current_value=82.5,
            max_value=100.0,
            status="normal",
            trend="stable",
        ),
        ResourceMetric(
            unit_id=units[0].id,
            metric_type="noise",
            current_value=42.0,
            max_value=80.0,
            status="normal",
            trend="up",
        ),
        # Resources for Bunker-9 Delta (worse conditions)
        ResourceMetric(
            unit_id=units[3].id,
            metric_type="oxygen",
            current_value=72.3,
            max_value=100.0,
            status="critical",
            trend="down",
        ),
        ResourceMetric(
            unit_id=units[3].id,
            metric_type="water",
            current_value=45.0,
            max_value=100.0,
            status="critical",
            trend="down",
        ),
        ResourceMetric(
            unit_id=units[3].id,
            metric_type="power",
            current_value=58.0,
            max_value=100.0,
            status="warning",
            trend="stable",
        ),
        ResourceMetric(
            unit_id=units[3].id,
            metric_type="noise",
            current_value=71.0,
            max_value=80.0,
            status="warning",
            trend="up",
        ),
    ]
    db.add_all(resources)

    db.commit()
    db.close()

    print("Database seeded successfully.")
    print(f"  Users:     {len(users)}")
    print(f"  Units:     {len(units)}")
    print(f"  Payments:  {len(payments)}")
    print(f"  Klarna:    {len(klarna)}")
    print(f"  Markets:   {len(markets)}")
    print(f"  Bets:      {len(bets)}")
    print(f"  Messages:  {len(messages)}")
    print(f"  Resources: {len(resources)}")
    print()
    print("Test credentials:")
    print("  CIT-7291 / citizen123  (Silver tier, warning status)")
    print("  CIT-0042 / citizen123  (Bronze tier, probation)")
    print("  CIT-9999 / admin       (Platinum tier, admin)")


if __name__ == "__main__":
    seed()
