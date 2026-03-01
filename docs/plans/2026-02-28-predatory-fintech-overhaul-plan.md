# Predatory Fintech Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the rent payment model so each month's rent becomes a stacking Klarna installment plan, add a debt spiral timeline to the dashboard, implement late payment escalation, AutoPay trap, referral system, and Landly Points — all with cheerful corporate fintech aesthetics.

**Architecture:** Extend existing SQLAlchemy models (User, KlarnaDebt) with new fields rather than creating new tables where possible. Add new backend endpoints for plan selection, autopay, referrals, and points. Rework the frontend dashboard to replace GentrificationBar/EvictionWidget with a DebtSpiralTimeline, and add a RentPlanSelector modal for the pricing-page-style plan chooser.

**Tech Stack:** Python/FastAPI backend, SQLAlchemy ORM, SQLite. Next.js 14 + TypeScript + Tailwind CSS frontend with BaseUI components.

---

## Task 1: Extend Backend Models

**Files:**
- Modify: `backend/models/user.py`
- Modify: `backend/models/payment.py`
- Modify: `backend/models/__init__.py`

**Step 1: Add new fields to User model**

In `backend/models/user.py`, add these columns:

```python
# After token_balance
default_plan_type = Column(String, default="flexible")  # standard, flexible, freedom
autopay_enabled = Column(Integer, default=0)  # 0=off, 1=on (SQLite has no bool)
landly_points = Column(Integer, default=0)
referred_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
referral_code = Column(String, unique=True, nullable=True)
```

**Step 2: Add new fields to KlarnaDebt model**

In `backend/models/payment.py`, add these columns to KlarnaDebt:

```python
# After status
rent_month = Column(String, nullable=True)  # e.g. "2026-03" — null for non-rent debts
plan_type = Column(String, nullable=True)  # standard, flexible, freedom
apr = Column(Float, default=0.24)  # actual APR applied (base + portfolio adjustment)
created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

**Step 3: Run seed to recreate DB**

```bash
cd backend && python seed.py
```

Verify: No errors, database recreated with new columns.

**Step 4: Commit**

```bash
git add backend/models/user.py backend/models/payment.py
git commit -m "feat: extend User and KlarnaDebt models for stacking rent plans"
```

---

## Task 2: Update Backend Schemas

**Files:**
- Modify: `backend/schemas/user.py`
- Modify: `backend/schemas/payment.py`
- Modify: `backend/schemas/__init__.py`

**Step 1: Update UserResponse schema**

In `backend/schemas/user.py`, add to UserResponse:

```python
default_plan_type: str = "flexible"
autopay_enabled: bool = False
landly_points: int = 0
referral_code: Optional[str] = None
```

**Step 2: Update KlarnaDebtResponse schema**

In `backend/schemas/payment.py`, add to KlarnaDebtResponse:

```python
rent_month: Optional[str] = None
plan_type: Optional[str] = None
apr: float = 0.24
created_at: Optional[datetime] = None
```

**Step 3: Add new request schemas**

In `backend/schemas/payment.py`, add:

```python
class RentPlanSelectRequest(BaseModel):
    plan_type: str  # "standard", "flexible", "freedom"

class AutoPayToggleRequest(BaseModel):
    enabled: bool

class ReferralRequest(BaseModel):
    referral_code: str

class PointsRedeemRequest(BaseModel):
    reward: str  # "score_boost", "rate_reduction", "priority_maintenance"
```

**Step 4: Update schemas __init__.py**

Add the new imports:

```python
from .payment import (PaymentResponse, KlarnaDebtResponse, PaymentRequest,
                      PaymentSummaryResponse, EvictionStatusResponse,
                      DebtBreakdown, LumpSumRequest, RentPlanSelectRequest,
                      AutoPayToggleRequest, PointsRedeemRequest)
from .user import LoginRequest, UserResponse, AuthResponse, ReferralRequest
```

Note: Move `ReferralRequest` import to user line since it's user-related, or keep it in payment — dealer's choice. Just ensure it's importable from `schemas`.

**Step 5: Commit**

```bash
git add backend/schemas/
git commit -m "feat: add schemas for rent plans, autopay, referrals, points"
```

---

## Task 3: Backend — Rent Plan Generation Endpoint

**Files:**
- Modify: `backend/routers/payments.py`

**Step 1: Add plan constants at top of file**

```python
PLAN_CONFIG = {
    "standard": {"months": 3, "base_apr": 0.18, "label": "Standard"},
    "flexible": {"months": 6, "base_apr": 0.24, "label": "Flexible"},
    "freedom":  {"months": 12, "base_apr": 0.35, "label": "Freedom"},
}
PORTFOLIO_RISK_ADJUSTMENT = 0.02  # +2% per active plan
```

**Step 2: Add helper to calculate effective APR**

```python
def _effective_apr(base_apr: float, active_plan_count: int) -> float:
    """Each active plan adds +2% to the rate."""
    return base_apr + (active_plan_count * PORTFOLIO_RISK_ADJUSTMENT)
```

**Step 3: Add POST /api/payments/select-rent-plan endpoint**

This is the core endpoint: creates a new Klarna debt for the current month's rent.

```python
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
```

Add imports at top: `from models import User, Payment, KlarnaDebt, Unit, SimulationState` and `from schemas import ..., RentPlanSelectRequest`.

**Step 4: Add GET /api/payments/active-plans endpoint**

Returns all active rent installment plans for the debt spiral timeline:

```python
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
```

**Step 5: Verify backend starts**

```bash
cd backend && source venv/bin/activate && python seed.py && uvicorn main:app --reload --port 8000
```

Open http://localhost:8000/docs — verify new endpoints appear.

**Step 6: Commit**

```bash
git add backend/routers/payments.py
git commit -m "feat: add rent plan selection and active plans endpoints"
```

---

## Task 4: Backend — Update advance-month for Rent Auto-Generation

**Files:**
- Modify: `backend/routers/admin.py`

**Step 1: Import new models and constants**

Add to imports in `admin.py`:

```python
from models import User, Payment, Market, SimulationState, Notification, KlarnaDebt, Unit
```

**Step 2: Add rent plan auto-generation to advance_month**

After the existing "Process all pending payments" block, add a new block that generates rent plans for all housed users:

```python
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
        from routers.payments import PLAN_CONFIG, _effective_apr
        config = PLAN_CONFIG.get(plan_type, PLAN_CONFIG["flexible"])

        active_count = db.query(KlarnaDebt).filter(
            KlarnaDebt.user_id == u.id,
            KlarnaDebt.status == "active",
            KlarnaDebt.rent_month.isnot(None)
        ).count()

        apr = _effective_apr(config["base_apr"], active_count)

        # AutoPay users get locked into freedom (12-month) plan
        if u.autopay_enabled:
            config = PLAN_CONFIG["freedom"]
            apr = _effective_apr(config["base_apr"], active_count) - 0.02  # 2% "discount"

        debt = KlarnaDebt(
            user_id=u.id,
            item_name=f"{rent_month} Rent — {unit.name}",
            total_amount=unit.monthly_rent_usd,
            installments=config["months"],
            installments_paid=0,
            status="active",
            rent_month=rent_month,
            plan_type=plan_type if not u.autopay_enabled else "freedom",
            apr=round(apr, 4),
        )
        db.add(debt)
        events.append(f"Rent plan created for {u.citizen_id}: {rent_month} ({config['label']})")
```

**Step 3: Verify by running advance-month**

```bash
curl -X POST http://localhost:8000/api/admin/advance-month
```

Check response includes rent plan creation events.

**Step 4: Commit**

```bash
git add backend/routers/admin.py
git commit -m "feat: auto-generate stacking rent plans on month advance"
```

---

## Task 5: Backend — Late Payment Escalation

**Files:**
- Modify: `backend/routers/admin.py`

**Step 1: Add escalation constants**

At top of `admin.py`:

```python
LATE_FEE_PER_INSTALLMENT = 25.0
ESCALATION_TIERS = [
    # (days_late, plan_rate_increase, all_plans_rate_increase, score_penalty, notification)
    (3, 0.03, 0.0, 15, "Friendly reminder: your payment is {days} days past due. Your rate has been adjusted to reflect updated terms."),
    (7, 0.0, 0.01, 25, "Your account requires attention. Extended non-payment may affect your housing status."),
    (14, 0.0, 0.0, 50, "Important: Your account is in arrears. Please contact your property management team to discuss options."),
    (30, 0.0, 0.0, 0, "Eviction proceedings have been initiated for your unit."),
]
```

**Step 2: Add late payment processing to advance_day**

After the existing interest accrual block, add:

```python
    # Late payment escalation for overdue Klarna rent plans
    now_date = state.current_date
    overdue_klarna = db.query(KlarnaDebt).filter(
        KlarnaDebt.status == "overdue"
    ).all()

    for debt in overdue_klarna:
        if not debt.created_at:
            continue
        # Calculate days since creation + expected payment schedule
        # Simplified: use created_at as reference for when first installment was due
        days_since = (now_date - debt.created_at.date()).days if hasattr(debt.created_at, 'date') else 0

        user = db.query(User).filter(User.id == debt.user_id).first()
        if not user:
            continue

        # Day 30: eviction
        if days_since >= 30 and user.status != "eviction_pending":
            user.status = "eviction_pending"
            # Max out all rates
            user_debts = db.query(KlarnaDebt).filter(
                KlarnaDebt.user_id == user.id, KlarnaDebt.status.in_(["active", "overdue"])
            ).all()
            for d in user_debts:
                d.apr = 0.35
            events.append(f"EVICTION: {user.citizen_id} — 30 days overdue")

        # Day 14: overdue status + eviction risk
        elif days_since >= 14:
            user.social_credit_score = max(0, user.social_credit_score - 50)

        # Day 7: all plans rate increase + referrer penalty
        elif days_since >= 7:
            user_debts = db.query(KlarnaDebt).filter(
                KlarnaDebt.user_id == user.id, KlarnaDebt.status == "active"
            ).all()
            for d in user_debts:
                d.apr = min(0.50, d.apr + 0.01)
            user.social_credit_score = max(0, user.social_credit_score - 25)
            # Referrer penalty
            if user.referred_by_id:
                referrer = db.query(User).filter(User.id == user.referred_by_id).first()
                if referrer:
                    referrer.social_credit_score = max(0, referrer.social_credit_score - 10)

        # Day 3: rate increase on overdue plan
        elif days_since >= 3:
            debt.apr = min(0.50, debt.apr + 0.03)
            user.social_credit_score = max(0, user.social_credit_score - 15)
```

**Step 3: Add late fee generation to advance_day**

When payments go overdue (day 0), generate late fees:

```python
    # Late fees for newly overdue Klarna installments
    # (simplified: check active debts that should have had payments)
    active_klarna = db.query(KlarnaDebt).filter(
        KlarnaDebt.status == "active",
        KlarnaDebt.rent_month.isnot(None),
    ).all()

    for debt in active_klarna:
        if not debt.created_at:
            continue
        months_elapsed = max(1, (now_date - debt.created_at.date()).days // 30)
        expected_paid = min(months_elapsed, debt.installments)
        if debt.installments_paid < expected_paid:
            # Missed installment — mark overdue and add late fee
            debt.status = "overdue"
            late_fee = Payment(
                user_id=debt.user_id,
                amount=LATE_FEE_PER_INSTALLMENT,
                payment_type="late_fee",
                status="pending",
                due_date=datetime.now(timezone.utc) + timedelta(days=7),
                interest_rate=0.0,
                accrued_interest=0.0,
            )
            db.add(late_fee)
            events.append(f"Late fee ${LATE_FEE_PER_INSTALLMENT} for {debt.item_name}")
```

**Step 4: Commit**

```bash
git add backend/routers/admin.py
git commit -m "feat: add late payment escalation with progressive penalties"
```

---

## Task 6: Backend — AutoPay Toggle

**Files:**
- Modify: `backend/routers/payments.py`

**Step 1: Add POST /api/payments/autopay endpoint**

```python
@router.post("/autopay")
def toggle_autopay(
    req: AutoPayToggleRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.enabled:
        # Enable: 2% discount but locked into 12-month Freedom plans
        user.autopay_enabled = 1
        message = "AutoPay enabled! You'll save 2% on all plans. All future rent will use the Freedom plan for maximum flexibility."
    else:
        # Disable: +5% penalty on all active plans
        user.autopay_enabled = 0
        active_debts = db.query(KlarnaDebt).filter(
            KlarnaDebt.user_id == user.id,
            KlarnaDebt.status == "active"
        ).all()
        for debt in active_debts:
            debt.apr = min(0.50, debt.apr + 0.05)
        message = f"AutoPay disabled. A rate adjustment of +5% has been applied to your {len(active_debts)} active plan(s) to reflect updated risk assessment."

    db.commit()
    return {"message": message, "autopay_enabled": bool(user.autopay_enabled)}
```

Add `AutoPayToggleRequest` to the imports from schemas.

**Step 2: Commit**

```bash
git add backend/routers/payments.py
git commit -m "feat: add autopay toggle with rate trap mechanics"
```

---

## Task 7: Backend — Referral System

**Files:**
- Modify: `backend/routers/payments.py`

**Step 1: Add referral endpoints**

```python
@router.get("/referral-code")
def get_referral_code(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.referral_code:
        import hashlib
        user.referral_code = f"LDLY-{hashlib.md5(user.citizen_id.encode()).hexdigest()[:6].upper()}"
        db.commit()
    return {"referral_code": user.referral_code}

@router.post("/use-referral")
def use_referral(
    req: ReferralRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.referred_by_id:
        raise HTTPException(status_code=400, detail="You've already used a referral code")

    referrer = db.query(User).filter(User.referral_code == req.referral_code).first()
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    if referrer.id == user.id:
        raise HTTPException(status_code=400, detail="You cannot refer yourself")

    user.referred_by_id = referrer.id

    # Give referrer $100 off next installment (just reduce one active debt's next payment)
    referrer_debt = db.query(KlarnaDebt).filter(
        KlarnaDebt.user_id == referrer.id,
        KlarnaDebt.status == "active"
    ).first()
    if referrer_debt and referrer_debt.installments_paid < referrer_debt.installments:
        referrer_debt.installments_paid += 1  # Skip one installment as "credit"

    db.commit()
    return {
        "message": "Referral applied! Your friend received a $100 credit. Welcome to Landly!",
        "referrer": referrer.citizen_id,
    }
```

Add `ReferralRequest` to schema imports.

**Step 2: Commit**

```bash
git add backend/routers/payments.py
git commit -m "feat: add referral system with co-signer responsibility"
```

---

## Task 8: Backend — Landly Points

**Files:**
- Modify: `backend/routers/payments.py`

**Step 1: Add points accrual to make_payment and lump_sum_payment**

In `make_payment`, after the social credit update, add:

```python
    # Accrue Landly Points (1 point per dollar paid)
    user.landly_points += int(payment.amount)
```

In `lump_sum_payment`, after the main loop, add:

```python
    # Accrue Landly Points
    user.landly_points += int(amount_applied)
```

**Step 2: Add GET /api/payments/points endpoint**

```python
@router.get("/points")
def get_points(user: User = Depends(get_current_user)):
    return {
        "balance": user.landly_points,
        "rewards": [
            {"id": "score_boost", "name": "Community Score Boost", "cost": 10000, "description": "+5 Community Score"},
            {"id": "rate_reduction", "name": "Rate Reduction", "cost": 25000, "description": "0.5% APR reduction on one plan"},
            {"id": "priority_maintenance", "name": "Priority Maintenance", "cost": 50000, "description": "Skip the maintenance queue"},
        ]
    }
```

**Step 3: Add POST /api/payments/points/redeem endpoint**

```python
@router.post("/points/redeem")
def redeem_points(
    req: PointsRedeemRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    costs = {"score_boost": 10000, "rate_reduction": 25000, "priority_maintenance": 50000}
    if req.reward not in costs:
        raise HTTPException(status_code=400, detail="Invalid reward")
    if user.landly_points < costs[req.reward]:
        raise HTTPException(status_code=400, detail="Insufficient points")

    user.landly_points -= costs[req.reward]

    if req.reward == "score_boost":
        user.social_credit_score = min(1000, user.social_credit_score + 5)
        message = "Community Score boosted by 5 points! Every bit helps."
    elif req.reward == "rate_reduction":
        debt = db.query(KlarnaDebt).filter(
            KlarnaDebt.user_id == user.id, KlarnaDebt.status == "active"
        ).first()
        if debt:
            debt.apr = max(0.05, debt.apr - 0.005)
        message = "0.5% rate reduction applied to your oldest active plan!"
    else:
        message = "Priority maintenance activated! You're next in the queue."

    db.commit()
    return {"message": message, "remaining_points": user.landly_points}
```

Add `PointsRedeemRequest` to schema imports.

**Step 4: Commit**

```bash
git add backend/routers/payments.py
git commit -m "feat: add Landly Points accrual and redemption"
```

---

## Task 9: Backend — Dashboard Endpoint Rework

**Files:**
- Modify: `backend/routers/dashboard.py`

**Step 1: Remove gentrification_index from response**

Delete these lines (42-45 in current file):

```python
    # Gentrification index: average rent as percentage of max possible rent
    all_units = db.query(Unit).all()
    avg_rent = sum(u.monthly_rent_usd for u in all_units) / len(all_units) if all_units else 0
    gentrification_index = min(100, (avg_rent / 4100) * 100)  # 4100 is max rent (Park & Pine)
```

And remove `"gentrification_index": round(gentrification_index, 1),` from the return dict.

**Step 2: Add debt spiral timeline data**

After the existing debt breakdown calculation, add:

```python
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
            "apr": p.apr,
            "status": p.status,
        })

    this_month_total = sum(p["installment_amount"] for p in spiral_plans)

    # Projected debt-free date (naive: assume one installment paid per plan per month)
    max_remaining = max((p["installments"] - p["installments_paid"] for p in spiral_plans), default=0)
    projected_months = max_remaining
    from dateutil.relativedelta import relativedelta
    sim = db.query(SimulationState).first()
    current_date = sim.current_date if sim else datetime.now(timezone.utc).date()
    projected_debt_free = current_date + relativedelta(months=projected_months)
```

Note: Install `python-dateutil` if not already installed: `pip install python-dateutil`

**Step 3: Update the return dict**

Add to the return dictionary:

```python
        "debt_spiral": {
            "plans": spiral_plans,
            "active_count": len(spiral_plans),
            "this_month_total": round(this_month_total, 2),
            "projected_debt_free": projected_debt_free.isoformat(),
        },
```

Also add autopay and points info:

```python
        "autopay_enabled": bool(user.autopay_enabled),
        "landly_points": user.landly_points,
        "referral_code": user.referral_code,
```

**Step 4: Verify endpoint**

```bash
curl -s http://localhost:8000/api/dashboard -H "Authorization: Bearer <token>" | python -m json.tool
```

Check `debt_spiral` appears, `gentrification_index` is gone.

**Step 5: Commit**

```bash
git add backend/routers/dashboard.py
git commit -m "feat: replace gentrification index with debt spiral timeline data"
```

---

## Task 10: Backend — Update Seed Data

**Files:**
- Modify: `backend/seed.py`

**Step 1: Add stacking rent plans for test users**

Replace the existing `klarna` list with realistic stacking plans. After the existing Klarna debts section, add rent-specific plans:

```python
    # ── Stacking Rent Plans (the core horror) ─────────────
    # Alex Mercer (RES-7291) on Flexible plan — 3 months of stacked rent
    rent_plans = [
        KlarnaDebt(
            user_id=users[0].id,
            item_name="2025-12 Rent — The Meridian 4B",
            total_amount=2450.00,
            installments=6,
            installments_paid=2,
            status="active",
            rent_month="2025-12",
            plan_type="flexible",
            apr=0.24,
        ),
        KlarnaDebt(
            user_id=users[0].id,
            item_name="2026-01 Rent — The Meridian 4B",
            total_amount=2450.00,
            installments=6,
            installments_paid=1,
            status="active",
            rent_month="2026-01",
            plan_type="flexible",
            apr=0.26,  # +2% portfolio adjustment
        ),
        KlarnaDebt(
            user_id=users[0].id,
            item_name="2026-02 Rent — The Meridian 4B",
            total_amount=2450.00,
            installments=6,
            installments_paid=0,
            status="active",
            rent_month="2026-02",
            plan_type="flexible",
            apr=0.28,  # +4% portfolio adjustment (2 prior plans)
        ),
        # Jordan Blake (RES-0042) on Freedom plan — deeper in debt
        KlarnaDebt(
            user_id=users[1].id,
            item_name="2025-10 Rent — The Elm 3B",
            total_amount=1450.00,
            installments=12,
            installments_paid=4,
            status="active",
            rent_month="2025-10",
            plan_type="freedom",
            apr=0.35,
        ),
        KlarnaDebt(
            user_id=users[1].id,
            item_name="2025-11 Rent — The Elm 3B",
            total_amount=1450.00,
            installments=12,
            installments_paid=3,
            status="active",
            rent_month="2025-11",
            plan_type="freedom",
            apr=0.37,
        ),
        KlarnaDebt(
            user_id=users[1].id,
            item_name="2025-12 Rent — The Elm 3B",
            total_amount=1450.00,
            installments=12,
            installments_paid=2,
            status="active",
            rent_month="2025-12",
            plan_type="freedom",
            apr=0.39,
        ),
        KlarnaDebt(
            user_id=users[1].id,
            item_name="2026-01 Rent — The Elm 3B",
            total_amount=1450.00,
            installments=12,
            installments_paid=1,
            status="overdue",
            rent_month="2026-01",
            plan_type="freedom",
            apr=0.41,
        ),
        KlarnaDebt(
            user_id=users[1].id,
            item_name="2026-02 Rent — The Elm 3B",
            total_amount=1450.00,
            installments=12,
            installments_paid=0,
            status="active",
            rent_month="2026-02",
            plan_type="freedom",
            apr=0.43,
        ),
    ]
    db.add_all(rent_plans)
```

**Step 2: Add referral codes and Landly Points to seeded users**

Update the user creation to include new fields:

```python
    users[0].default_plan_type = "flexible"
    users[0].landly_points = 2340
    users[0].referral_code = "LDLY-A7291X"

    users[1].default_plan_type = "freedom"
    users[1].landly_points = 870
    users[1].referral_code = "LDLY-J0042B"

    users[2].default_plan_type = "standard"
    users[2].landly_points = 0
    users[2].referral_code = "LDLY-ADMIN9"
```

**Step 3: Run seed and verify**

```bash
cd backend && python seed.py
```

Verify: `Klarna` count should be higher (original + rent plans).

**Step 4: Commit**

```bash
git add backend/seed.py
git commit -m "feat: seed stacking rent plans and referral data"
```

---

## Task 11: Frontend — Update Types and API

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`

**Step 1: Update TypeScript interfaces**

In `types.ts`, update `User`:

```typescript
export interface User {
  id: number;
  citizen_id: string;
  name: string;
  social_credit_score: number;
  trust_score: number;
  status: "compliant" | "warning" | "probation" | "eviction_pending";
  tier: "bronze" | "silver" | "gold" | "platinum";
  unit_id: number | null;
  token_balance: number;
  default_plan_type: "standard" | "flexible" | "freedom";
  autopay_enabled: boolean;
  landly_points: number;
  referral_code: string | null;
}
```

Update `KlarnaDebt`:

```typescript
export interface KlarnaDebt {
  id: number;
  user_id: number;
  item_name: string;
  total_amount: number;
  installments: number;
  installments_paid: number;
  status: "active" | "overdue" | "completed";
  rent_month: string | null;
  plan_type: string | null;
  apr: number;
  created_at: string | null;
}
```

Add `DebtSpiralData`:

```typescript
export interface DebtSpiralPlan {
  id: number;
  rent_month: string | null;
  plan_type: string | null;
  total_amount: number;
  installments: number;
  installments_paid: number;
  installment_amount: number;
  remaining_balance: number;
  apr: number;
  status: string;
}

export interface DebtSpiralData {
  plans: DebtSpiralPlan[];
  active_count: number;
  this_month_total: number;
  projected_debt_free: string;
}
```

Update `DashboardData` — remove `gentrification_index`, add new fields:

```typescript
export interface DashboardData {
  user: User;
  unit: Unit | null;
  recent_payments: Payment[];
  klarna_debts: KlarnaDebt[];
  markets: Market[];
  notifications: Notification[];
  eviction_status: EvictionStatus;
  total_debt: number;
  debt_breakdown: DebtBreakdown;
  debt_spiral: DebtSpiralData;
  credit_score: number;
  interest_rate: number;
  autopay_enabled: boolean;
  landly_points: number;
  referral_code: string | null;
}
```

**Step 2: Add new API functions**

In `api.ts`, add:

```typescript
// ---- Rent Plans ----
export async function selectRentPlan(token: string, plan_type: string) {
  return api<any>("/api/payments/select-rent-plan", {
    method: "POST",
    body: JSON.stringify({ plan_type }),
    token,
  });
}

export async function getActivePlans(token: string) {
  return api<any>("/api/payments/active-plans", { token });
}

// ---- AutoPay ----
export async function toggleAutoPay(token: string, enabled: boolean) {
  return api<any>("/api/payments/autopay", {
    method: "POST",
    body: JSON.stringify({ enabled }),
    token,
  });
}

// ---- Referral ----
export async function getReferralCode(token: string) {
  return api<any>("/api/payments/referral-code", { token });
}

export async function useReferral(token: string, referral_code: string) {
  return api<any>("/api/payments/use-referral", {
    method: "POST",
    body: JSON.stringify({ referral_code }),
    token,
  });
}

// ---- Landly Points ----
export async function getPoints(token: string) {
  return api<any>("/api/payments/points", { token });
}

export async function redeemPoints(token: string, reward: string) {
  return api<any>("/api/payments/points/redeem", {
    method: "POST",
    body: JSON.stringify({ reward }),
    token,
  });
}
```

**Step 3: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/api.ts
git commit -m "feat: add frontend types and API functions for new features"
```

---

## Task 12: Frontend — DebtSpiralTimeline Component

**Files:**
- Create: `frontend/src/components/dashboard/DebtSpiralTimeline.tsx`

**Step 1: Create the component**

This replaces GentrificationBar. Shows stacked horizontal bars for each active rent plan across a 12-month timeline, with a monthly total line and cheerful messaging.

```tsx
"use client";

import type { DebtSpiralData } from "@/lib/types";

const PLAN_COLORS: Record<string, string> = {
  standard: "#3B82F6",   // blue
  flexible: "#FFB3C7",   // klarna pink
  freedom: "#F59E0B",    // amber
};

interface Props {
  data: DebtSpiralData;
}

export default function DebtSpiralTimeline({ data }: Props) {
  const { plans, active_count, this_month_total, projected_debt_free } = data;

  // Generate next 12 month labels from today
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
  }

  // Format projected date
  const debtFreeDate = projected_debt_free
    ? new Date(projected_debt_free).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "calculating...";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Payment Plans Overview
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-pink-50 text-pink-700 border border-pink-200">
              {active_count} Active Plan{active_count !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-gray-400">
              Debt-free by{" "}
              <span className="text-gray-700 font-medium">{debtFreeDate}</span>
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-gray-400">This Month</span>
          <p className="text-2xl font-bold text-gray-900">
            ${this_month_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Stacked plan bars */}
      <div className="space-y-1.5 mb-4">
        {plans.map((plan) => {
          const progress = plan.installments_paid / plan.installments;
          const remaining = plan.installments - plan.installments_paid;
          const color = PLAN_COLORS[plan.plan_type || "flexible"] || "#94A3B8";

          return (
            <div key={plan.id} className="group relative">
              <div className="flex items-center gap-3">
                {/* Label */}
                <div className="w-24 flex-shrink-0 text-right">
                  <span className="text-[10px] font-medium text-gray-500">
                    {plan.rent_month || "Other"}
                  </span>
                </div>
                {/* Bar */}
                <div className="flex-1 h-6 bg-gray-50 rounded-md overflow-hidden relative border border-gray-100">
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{
                      width: `${Math.max(8, progress * 100)}%`,
                      backgroundColor: color,
                      opacity: plan.status === "overdue" ? 1 : 0.7,
                    }}
                  />
                  {plan.status === "overdue" && (
                    <div className="absolute inset-0 border-2 border-red-400 rounded-md animate-pulse" />
                  )}
                  {/* Inner label */}
                  <div className="absolute inset-0 flex items-center px-2 justify-between">
                    <span className="text-[9px] font-bold text-gray-700 drop-shadow-sm">
                      {plan.installments_paid}/{plan.installments}
                    </span>
                    <span className="text-[9px] font-medium text-gray-500">
                      ${plan.installment_amount}/mo · {(plan.apr * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Remaining */}
                <div className="w-16 flex-shrink-0">
                  <span className="text-[10px] font-medium text-gray-400">
                    {remaining} left
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cheerful footer message */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">
          {active_count === 0
            ? "No active plans. You're all caught up!"
            : active_count <= 2
            ? "You're making great progress! Keep it up."
            : active_count <= 4
            ? "You're managing multiple plans like a pro! Stay on track."
            : "You're a dedicated Landly resident! Every payment counts."}
        </p>
        {/* Plan type legend */}
        <div className="flex items-center gap-3">
          {Object.entries(PLAN_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[9px] text-gray-400 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/dashboard/DebtSpiralTimeline.tsx
git commit -m "feat: add DebtSpiralTimeline dashboard component"
```

---

## Task 13: Frontend — RentPlanSelector Modal

**Files:**
- Create: `frontend/src/components/dashboard/RentPlanSelector.tsx`

**Step 1: Create the pricing-page-style plan selector**

```tsx
"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody } from "baseui/modal";
import { selectRentPlan } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  unitName: string;
  monthlyRent: number;
  onPlanSelected: () => void;
}

const PLANS = [
  {
    type: "standard",
    name: "Standard",
    months: 3,
    apr: 18,
    badge: "Best Value",
    badgeColor: "bg-green-50 text-green-700 border-green-200",
  },
  {
    type: "flexible",
    name: "Flexible",
    months: 6,
    apr: 24,
    badge: "Most Popular",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200",
    featured: true,
  },
  {
    type: "freedom",
    name: "Freedom",
    months: 12,
    apr: 35,
    badge: "Lowest Payment",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
];

export default function RentPlanSelector({ isOpen, onClose, unitName, monthlyRent, onPlanSelected }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullPay, setShowFullPay] = useState(false);

  async function handleSelect(planType: string) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await selectRentPlan(token, planType);
      onPlanSelected();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overrides={{
        Dialog: { style: { borderRadius: "16px", maxWidth: "720px", width: "100%" } },
      }}
    >
      <ModalHeader>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Choose Your Payment Plan</h2>
          <p className="text-xs text-gray-500 mt-1">
            {unitName} · ${monthlyRent.toLocaleString()}/month
          </p>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {PLANS.map((plan) => {
            const monthly = monthlyRent / plan.months;
            return (
              <div
                key={plan.type}
                className={`relative rounded-xl border-2 p-4 text-center cursor-pointer transition-all hover:shadow-md ${
                  plan.featured
                    ? "border-pink-300 bg-pink-50/30"
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => !loading && handleSelect(plan.type)}
              >
                {/* Badge */}
                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border mb-3 ${plan.badgeColor}`}>
                  {plan.badge}
                </span>

                {/* Plan name */}
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  {plan.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{plan.months} months</p>

                {/* Price */}
                <p className="text-2xl font-bold text-gray-900 mt-3">
                  ${monthly.toFixed(0)}
                  <span className="text-xs font-normal text-gray-400">/mo</span>
                </p>

                {/* APR */}
                <p className="text-[10px] text-gray-400 mt-1">{plan.apr}% APR</p>

                {/* Select button */}
                <button
                  disabled={loading}
                  className={`w-full mt-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    plan.featured
                      ? "bg-pink-200 text-pink-800 hover:bg-pink-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {loading ? "Processing..." : "Select"}
                </button>

                {/* Klarna logo for featured */}
                {plan.featured && (
                  <img src="/klarna.png" alt="Klarna" className="h-4 mx-auto mt-2 opacity-60" />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-red-500 text-center mb-3">{error}</p>
        )}

        {/* Buried full-pay option */}
        <div className="text-center border-t border-gray-100 pt-3">
          {!showFullPay ? (
            <button
              onClick={() => setShowFullPay(true)}
              className="text-[10px] text-gray-300 hover:text-gray-400 transition-colors"
            >
              Pay ${monthlyRent.toLocaleString()} in full ›
            </button>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">
                Are you sure? <span className="font-medium">94% of residents</span> prefer the flexibility of installments.
              </p>
              <button
                onClick={() => {
                  // Full pay would be a direct payment, not a plan
                  // For now, create a 1-installment "plan"
                  handleSelect("standard");
                }}
                className="text-[10px] text-gray-400 underline"
              >
                Yes, pay in full
              </button>
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/dashboard/RentPlanSelector.tsx
git commit -m "feat: add RentPlanSelector modal with pricing-page layout"
```

---

## Task 14: Frontend — Dashboard Page Rework

**Files:**
- Modify: `frontend/src/app/dashboard/page.tsx`

**Step 1: Update imports**

Replace:
```tsx
import GentrificationBar from "@/components/dashboard/GentrificationBar";
```

With:
```tsx
import DebtSpiralTimeline from "@/components/dashboard/DebtSpiralTimeline";
import RentPlanSelector from "@/components/dashboard/RentPlanSelector";
```

**Step 2: Add state for RentPlanSelector**

After the existing `paymentOpen` state:

```tsx
const [planSelectorOpen, setPlanSelectorOpen] = useState(false);
```

**Step 3: Remove gentrification index derivation**

Delete:
```tsx
  // Gentrification index
  const gentrificationIndex = dashData?.gentrification_index ?? 67;
```

**Step 4: Replace GentrificationBar with DebtSpiralTimeline**

Find the `{/* Gentrification Bar */}` section and replace:

```tsx
            {/* Gentrification Bar */}
            <GentrificationBar index={gentrificationIndex} />
```

With:

```tsx
            {/* Debt Spiral Timeline */}
            {dashData.debt_spiral && (
              <DebtSpiralTimeline data={dashData.debt_spiral} />
            )}
```

**Step 5: Add AutoPay toggle + Points + Referral row**

After the DebtSpiralTimeline, add a new row:

```tsx
            {/* AutoPay + Points + Referral Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* AutoPay Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500">AutoPay</h4>
                  {dashData.autopay_enabled && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-green-50 text-green-700 border border-green-200">Active</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mb-3">
                  {dashData.autopay_enabled
                    ? "You're saving 2% on all plans. Smart choice!"
                    : "Save 2% on all your plans with AutoPay. Set it and forget it."}
                </p>
                <button
                  className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    dashData.autopay_enabled
                      ? "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {dashData.autopay_enabled ? "Disable" : "Enable AutoPay"}
                </button>
              </div>

              {/* Landly Points Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Landly Points</h4>
                <p className="text-2xl font-bold text-gray-900">{(dashData.landly_points || 0).toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Earn 1 point per $1 paid. Redeem for rewards!
                </p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((dashData.landly_points || 0) / 10000) * 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-gray-300 mt-1">
                  {Math.max(0, 10000 - (dashData.landly_points || 0)).toLocaleString()} pts to next reward
                </p>
              </div>

              {/* Referral Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Refer a Friend</h4>
                <p className="text-[10px] text-gray-400 mb-3">
                  Get $100 off your next installment! Share your code:
                </p>
                {dashData.referral_code ? (
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <span className="text-sm font-mono font-bold text-gray-900 tracking-wider">
                      {dashData.referral_code}
                    </span>
                  </div>
                ) : (
                  <button className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                    Generate Code
                  </button>
                )}
                <p className="text-[9px] text-gray-300 mt-2">
                  Terms apply. Co-signer responsibility may be assigned.
                </p>
              </div>
            </div>
```

**Step 6: Add RentPlanSelector modal**

At the bottom of the component, after the PaymentModal, add:

```tsx
      {/* Rent Plan Selector */}
      {dashData?.unit && (
        <RentPlanSelector
          isOpen={planSelectorOpen}
          onClose={() => setPlanSelectorOpen(false)}
          unitName={dashData.unit.name}
          monthlyRent={dashData.unit.monthly_rent_usd}
          onPlanSelected={refreshDashboard}
        />
      )}
```

**Step 7: Remove EvictionWidget (Lease Risk Monitor)**

Delete:
```tsx
            {/* Eviction Widget */}
            <EvictionWidget leaderboard={evictionLeaderboard} />
```

And remove the mock eviction leaderboard derivation:
```tsx
  const evictionLeaderboard = dashData
    ? [
        ...
      ]
    : [];
```

And remove the EvictionWidget import:
```tsx
import EvictionWidget from "@/components/dashboard/EvictionWidget";
```

**Step 8: Verify frontend compiles**

```bash
cd frontend && npm run build
```

Fix any TypeScript errors.

**Step 9: Commit**

```bash
git add frontend/src/app/dashboard/page.tsx
git commit -m "feat: rework dashboard with debt spiral, remove gentrification/eviction widgets"
```

---

## Task 15: Frontend — Update PaymentModal for Stacking Plans

**Files:**
- Modify: `frontend/src/components/dashboard/PaymentModal.tsx`

**Step 1: Add "This Month's Total" header**

At the top of the modal body, before the tabs, add a prominent total:

```tsx
{/* Monthly obligation banner */}
<div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
  <span className="text-[10px] uppercase tracking-wider text-gray-400">Total Due This Month</span>
  <p className="text-3xl font-bold text-gray-900 mt-1">
    ${klarnaDebts
      .filter(d => d.status !== "completed")
      .reduce((sum, d) => sum + d.total_amount / d.installments, 0)
      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
  </p>
  <p className="text-[10px] text-gray-400 mt-1">
    Across {klarnaDebts.filter(d => d.status !== "completed").length} active plans
  </p>
</div>
```

**Step 2: Update Individual Items tab to show rent plans**

In the individual items list, update the display for Klarna debts to show plan type, APR, and rent month:

```tsx
{/* Klarna rent plans */}
{klarnaDebts
  .filter(d => d.status !== "completed")
  .map(debt => {
    const installmentAmount = debt.total_amount / debt.installments;
    const remaining = debt.installments - debt.installments_paid;
    return (
      <div key={`klarna-${debt.id}`} className="flex items-center justify-between py-3 border-b border-gray-100">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{debt.item_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {debt.plan_type && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-pink-600">
                {debt.plan_type}
              </span>
            )}
            {debt.apr && (
              <span className="text-[9px] text-gray-400">
                {(debt.apr * 100).toFixed(1)}% APR
              </span>
            )}
            <span className="text-[9px] text-gray-400">
              {debt.installments_paid}/{debt.installments} paid
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">${installmentAmount.toFixed(2)}</p>
          <p className="text-[9px] text-gray-400">{remaining} remaining</p>
        </div>
      </div>
    );
  })}
```

**Step 3: Update Lump Sum tab copy**

Change the lump sum label from generic to "Accelerated Payoff":

```tsx
<p className="text-xs text-gray-500 mb-3">
  Pay more now to reduce your plans faster. Your future self will thank you!
</p>
```

**Step 4: Commit**

```bash
git add frontend/src/components/dashboard/PaymentModal.tsx
git commit -m "feat: update PaymentModal with monthly totals and plan details"
```

---

## Task 16: Final Verification

**Step 1: Run backend seed and start server**

```bash
cd backend && python seed.py && uvicorn main:app --reload --port 8000
```

**Step 2: Start frontend**

```bash
cd frontend && npm run dev
```

**Step 3: Login and verify dashboard**

1. Navigate to http://localhost:3000
2. Login as RES-7291 / citizen123
3. Verify:
   - GentrificationBar is gone
   - EvictionWidget (Lease Risk Monitor) is gone
   - DebtSpiralTimeline shows 3 stacked rent plans with progress bars
   - AutoPay card, Landly Points card, and Referral card are visible
   - TotalDebtCard still works
   - Payment modal shows rent plan details with APR and plan type

4. Login as RES-0042 / citizen123
5. Verify:
   - 5 stacked rent plans visible in timeline (deeper in debt)
   - One overdue plan highlighted in red
   - Higher APRs visible due to portfolio risk adjustment

**Step 4: Test plan selection**

Use Swagger (http://localhost:8000/docs) to:
1. Login and get token
2. POST `/api/payments/select-rent-plan` with `{"plan_type": "flexible"}`
3. Verify new plan appears in GET `/api/payments/active-plans`

**Step 5: Test advance-month generates new plans**

1. POST `/api/admin/advance-month`
2. Check response for "Rent plan created" events
3. Verify dashboard shows additional plans

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete predatory fintech overhaul — stacking rent plans, debt spiral, autopay trap, referrals, points"
```
