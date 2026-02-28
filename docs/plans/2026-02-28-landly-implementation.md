# Landly Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a satirical dystopian apartment management app with marketplace, tenant dashboard, voice AI landlord, eviction betting, and time simulation.

**Architecture:** Next.js 14 frontend with FastAPI backend. SQLite database (already seeded). Claude Haiku for AI landlord text generation, OpenAI Whisper for STT, OpenAI TTS for voice output. Parallel agent development in worktrees — backend API and frontend shell built first, then feature pages in parallel.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, FastAPI, SQLAlchemy, SQLite, Claude Haiku, OpenAI Whisper/TTS

---

## Phase 1: Foundation

### Task 1: Backend — Pydantic Schemas

**Files:**
- Create: `backend/schemas/user.py`
- Create: `backend/schemas/unit.py`
- Create: `backend/schemas/payment.py`
- Create: `backend/schemas/market.py`
- Create: `backend/schemas/chat.py`
- Create: `backend/schemas/notification.py`
- Create: `backend/schemas/admin.py`
- Modify: `backend/schemas/__init__.py`

**Step 1: Create all Pydantic schemas**

These mirror the SQLAlchemy models but as Pydantic response/request models.

`backend/schemas/user.py`:
```python
from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    citizen_id: str
    password: str

class UserResponse(BaseModel):
    id: int
    citizen_id: str
    name: str
    social_credit_score: int
    trust_score: float
    status: str
    tier: str
    unit_id: Optional[int] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
```

`backend/schemas/unit.py`:
```python
from pydantic import BaseModel
from typing import Optional

class UnitResponse(BaseModel):
    id: int
    name: str
    sector: str
    level: int
    weekly_rent_credits: int
    monthly_rent_usd: float
    radiation_level: float
    altitude: int
    smart_lock_status: str
    oxygen_quality: float
    image_url: Optional[str] = None
    is_available: bool

    class Config:
        from_attributes = True

class UnitApplyRequest(BaseModel):
    klarna_installments: int = 4  # 3, 6, or 12
```

`backend/schemas/payment.py`:
```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PaymentResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    payment_type: str
    status: str
    due_date: datetime
    interest_rate: float
    accrued_interest: float
    created_at: datetime

    class Config:
        from_attributes = True

class KlarnaDebtResponse(BaseModel):
    id: int
    user_id: int
    item_name: str
    total_amount: float
    installments: int
    installments_paid: int
    status: str

    class Config:
        from_attributes = True

class PaymentRequest(BaseModel):
    payment_id: int
    amount: float

class PaymentSummaryResponse(BaseModel):
    total_owed: float
    next_due_date: Optional[datetime] = None
    overdue_count: int
    payments: list[PaymentResponse]
    klarna_debts: list[KlarnaDebtResponse]

class EvictionStatusResponse(BaseModel):
    is_pending: bool
    deadline: Optional[str] = None
    reason: Optional[str] = None
    amount_owed: float
```

`backend/schemas/market.py`:
```python
from pydantic import BaseModel

class MarketResponse(BaseModel):
    id: int
    question: str
    category: str
    yes_price: float
    no_price: float
    volume: int
    is_active: bool

    class Config:
        from_attributes = True

class MarketBetRequest(BaseModel):
    position: str  # "yes" or "no"
    amount: float

class MarketBetResponse(BaseModel):
    id: int
    user_id: int
    market_id: int
    position: str
    amount: float

    class Config:
        from_attributes = True

class LeaderboardEntry(BaseModel):
    citizen_id: str
    name: str
    missed_payments: int
    social_credit_score: int
    eviction_odds: float
    total_owed: float
```

`backend/schemas/chat.py`:
```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    role: str
    content: str
    negotiation_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSendRequest(BaseModel):
    message: str
    negotiation_id: Optional[str] = None
```

`backend/schemas/notification.py`:
```python
from pydantic import BaseModel
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    category: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
```

`backend/schemas/admin.py`:
```python
from pydantic import BaseModel
from datetime import date

class SimulationStateResponse(BaseModel):
    current_date: date
    day_number: int

class AdvanceTimeResponse(BaseModel):
    previous_date: date
    new_date: date
    events: list[str]  # list of things that happened (payments due, markets resolved, etc.)
```

`backend/schemas/__init__.py`:
```python
from .user import LoginRequest, UserResponse, AuthResponse
from .unit import UnitResponse, UnitApplyRequest
from .payment import (PaymentResponse, KlarnaDebtResponse, PaymentRequest,
                      PaymentSummaryResponse, EvictionStatusResponse)
from .market import MarketResponse, MarketBetRequest, MarketBetResponse, LeaderboardEntry
from .chat import ChatMessageResponse, ChatSendRequest
from .notification import NotificationResponse
from .admin import SimulationStateResponse, AdvanceTimeResponse
```

**Step 2: Commit**

```bash
git add backend/schemas/
git commit -m "feat: add Pydantic schemas for all API endpoints"
```

---

### Task 2: Backend — New Models (SimulationState, Notification, TenantRating)

**Files:**
- Create: `backend/models/simulation.py`
- Create: `backend/models/notification.py`
- Create: `backend/models/rating.py`
- Modify: `backend/models/__init__.py`
- Modify: `backend/seed.py` (add initial simulation state + sample notifications)

**Step 1: Create new models**

`backend/models/simulation.py`:
```python
from sqlalchemy import Column, Integer, Date
from database import Base
from datetime import date

class SimulationState(Base):
    __tablename__ = "simulation_state"

    id = Column(Integer, primary_key=True, default=1)
    current_date = Column(Date, default=date.today)
    day_number = Column(Integer, default=1)
```

`backend/models/notification.py`:
```python
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    message = Column(Text)
    category = Column(String, default="general")  # general, warning, violation, maintenance
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="notifications")
```

`backend/models/rating.py`:
```python
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class TenantRating(Base):
    __tablename__ = "tenant_ratings"

    id = Column(Integer, primary_key=True, index=True)
    rater_id = Column(Integer, ForeignKey("users.id"))
    rated_id = Column(Integer, ForeignKey("users.id"))
    noise = Column(Float, default=3.0)       # 1-5
    cleanliness = Column(Float, default=3.0) # 1-5
    loyalty = Column(Float, default=3.0)     # 1-5
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    rater = relationship("User", foreign_keys=[rater_id], backref="ratings_given")
    rated = relationship("User", foreign_keys=[rated_id], backref="ratings_received")
```

**Step 2: Update `backend/models/__init__.py`** to export new models.

**Step 3: Update `backend/seed.py`** to seed SimulationState with today's date, and add sample notifications like:
- "Your breathing patterns were flagged at 03:47 AM"
- "Rent increase of 8.3% approved effective next cycle"
- "Neighbor CIT-0042 reported suspicious cooking aromas from your unit"
- "Your Social Credit Score decreased by 12 points — reason: excessive hallway loitering"

**Step 4: Commit**

```bash
git add backend/models/ backend/seed.py
git commit -m "feat: add SimulationState, Notification, TenantRating models + seed data"
```

---

### Task 3: Backend — Auth Router + JWT Service

**Files:**
- Create: `backend/services/auth.py`
- Create: `backend/routers/auth.py`
- Modify: `backend/main.py` (register router)

**Step 1: Create auth service**

`backend/services/auth.py`:
```python
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User
from config import Settings

settings = Settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(citizen_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    return jwt.encode({"sub": citizen_id, "exp": expire}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        citizen_id = payload.get("sub")
        if not citizen_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.citizen_id == citizen_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

**Step 2: Create auth router**

`backend/routers/auth.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import LoginRequest, AuthResponse, UserResponse
from services.auth import verify_password, create_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.citizen_id == req.citizen_id).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.citizen_id)
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))

@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)
```

**Step 3: Register router in `backend/main.py`**

Add `from routers.auth import router as auth_router` and `app.include_router(auth_router)`.

**Step 4: Test manually**

```bash
cd backend && python seed.py && uvicorn main:app --reload --port 8000
# POST http://localhost:8000/api/auth/login with {"citizen_id": "CIT-7291", "password": "citizen123"}
```

**Step 5: Commit**

```bash
git add backend/services/auth.py backend/routers/auth.py backend/main.py
git commit -m "feat: add auth router with JWT login and /me endpoint"
```

---

### Task 4: Backend — All CRUD Routers

**Files:**
- Create: `backend/routers/dashboard.py`
- Create: `backend/routers/units.py`
- Create: `backend/routers/payments.py`
- Create: `backend/routers/markets.py`
- Create: `backend/routers/chat.py`
- Create: `backend/routers/notifications.py`
- Create: `backend/routers/ratings.py`
- Create: `backend/routers/admin.py`
- Modify: `backend/main.py` (register all routers)
- Modify: `backend/config.py` (add OPENAI_API_KEY)
- Modify: `backend/requirements.txt` (add openai)

**Step 1: Dashboard router**

`backend/routers/dashboard.py` — `GET /api/dashboard` returns aggregated DashboardData for the logged-in user: user info, unit info, resources, recent payments, klarna debts, active markets, eviction status, notifications, gentrification index (calculated from avg rent increases across all units).

**Step 2: Units router**

`backend/routers/units.py`:
- `GET /api/units` — list all available units with optional filters (sector, max_price)
- `GET /api/units/{id}` — get single unit details
- `POST /api/units/{id}/apply` — apply to rent a unit (creates Klarna debt entries for installments)

**Step 3: Payments router**

`backend/routers/payments.py`:
- `GET /api/payments/summary` — all payments + klarna debts for current user
- `POST /api/payments/pay` — make a payment (mark payment as paid, update klarna installments)
- `GET /api/payments/eviction-status` — check if user is facing eviction

**Step 4: Markets router**

`backend/routers/markets.py`:
- `GET /api/markets` — list all active markets
- `POST /api/markets/{id}/bet` — place a bet (adjust yes/no prices based on volume)
- `GET /api/markets/leaderboard` — eviction leaderboard: all users ranked by eviction odds (calculated from missed payments, social credit, total owed)

**Step 5: Chat router**

`backend/routers/chat.py`:
- `POST /api/chat/send` — text-based chat with Claude Haiku SSE streaming. System prompt: "You are an AI landlord managing a dystopian apartment complex. You know tenant law but always act in the worst interest of the tenant. Maximize legal delays. Be passive-aggressive and bureaucratic."
- `POST /api/chat/voice` — accepts audio file upload, transcribes via OpenAI Whisper, generates response via Claude Haiku, converts to speech via OpenAI TTS, returns audio
- `GET /api/chat/history` — get chat history for current user

**Step 6: Notifications router**

`backend/routers/notifications.py`:
- `GET /api/notifications` — get all notifications for current user

**Step 7: Ratings router**

`backend/routers/ratings.py`:
- `POST /api/ratings/{user_id}` — rate a tenant (noise, cleanliness, loyalty). Updates their social credit score.
- `GET /api/ratings/{user_id}` — get average ratings for a tenant

**Step 8: Admin/Time router**

`backend/routers/admin.py`:
- `GET /api/admin/current-date` — get current simulated date
- `POST /api/admin/advance-day` — advance 1 day. Accrue interest on overdue payments, possibly generate a notification.
- `POST /api/admin/advance-month` — advance 30 days. Accrue interest, check payment due dates, mark overdue payments, resolve active markets, generate notifications, update eviction status, increment gentrification index.

**Step 9: Register all routers in `backend/main.py`**

**Step 10: Add `openai>=1.0.0` to `backend/requirements.txt`**, add `OPENAI_API_KEY` to `backend/config.py`.

**Step 11: Commit**

```bash
git add backend/
git commit -m "feat: add all API routers (dashboard, units, payments, markets, chat, notifications, ratings, admin)"
```

---

### Task 5: Frontend — App Shell, Navigation, Auth

**Files:**
- Create: `frontend/src/lib/auth.tsx` (auth context + hook)
- Create: `frontend/src/components/layout/Sidebar.tsx`
- Create: `frontend/src/components/layout/TimeBar.tsx`
- Create: `frontend/src/components/layout/AppLayout.tsx`
- Create: `frontend/src/app/login/page.tsx`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/lib/api.ts` (add more API functions)

**Step 1: Auth context**

`frontend/src/lib/auth.tsx` — React context providing `user`, `token`, `login()`, `logout()`, and `isAuthenticated`. Stores token in localStorage. On mount, calls `/api/auth/me` to validate existing token.

**Step 2: Sidebar navigation**

`frontend/src/components/layout/Sidebar.tsx` — Dark sidebar matching the mockup aesthetic. Links to: Dashboard, Marketplace, AI Landlord, Markets, Leaderboard. Shows user citizen ID, tier badge, and social credit score. Logout button at bottom.

**Step 3: Time simulation floating bar**

`frontend/src/components/layout/TimeBar.tsx` — Sticky bar at bottom of screen. Shows current simulated date. "Advance Day" and "Advance Month" buttons. Fetches/updates via `/api/admin/` endpoints.

**Step 4: App layout wrapper**

`frontend/src/components/layout/AppLayout.tsx` — Wraps authenticated pages with Sidebar + TimeBar. Redirects to /login if not authenticated.

**Step 5: Login page**

`frontend/src/app/login/page.tsx` — Dystopian-styled login form. Citizen ID + password fields. "AUTHENTICATE" button. Error display. On success, redirect to /dashboard. Use design system colors (dark purple, brutalist cards).

**Step 6: Update API client**

Add typed API functions to `frontend/src/lib/api.ts`: `login()`, `getMe()`, `getDashboard()`, `getUnits()`, `getMarkets()`, `getPaymentSummary()`, `placeBet()`, `advanceDay()`, `advanceMonth()`, `getCurrentDate()`, `getNotifications()`, etc.

**Step 7: Commit**

```bash
git add frontend/src/
git commit -m "feat: add app shell with sidebar, time bar, auth context, and login page"
```

---

## Phase 2: Feature Pages (Parallel)

> These 4 tasks can be executed in parallel by separate agents, each in its own worktree.

### Task 6: Frontend — Dashboard Page

**Files:**
- Create: `frontend/src/app/dashboard/page.tsx`
- Create: `frontend/src/components/dashboard/ScoreCard.tsx`
- Create: `frontend/src/components/dashboard/PaymentTable.tsx`
- Create: `frontend/src/components/dashboard/NotificationFeed.tsx`
- Create: `frontend/src/components/dashboard/AdBanner.tsx`
- Create: `frontend/src/components/dashboard/GentrificationBar.tsx`
- Create: `frontend/src/components/dashboard/EvictionWidget.tsx`

**Description:**

Dashboard page fetches `/api/dashboard` and displays:

1. **Score Cards row:** Credit Score (gauge, 300-850), Social Credit Score (gauge, 0-1000 with color coding: green >700, yellow 400-700, red <400), Interest Rate (percentage display)
2. **Unit info card:** Current apartment name, sector, level, smart lock status, resource metrics (oxygen, water, power, noise bars)
3. **Outstanding Payments table:** Due/overdue payments with Klarna pink badges, amounts, dates, status pills
4. **Notification Feed:** Scrollable list of passive-aggressive notices with timestamps and category icons
5. **Ad Banners:** 2-3 satirical ads rotating: "Klarna: Split your suffering into 12 easy payments", "Upgrade to Platinum — breathe premium oxygen!", "Report a neighbor, earn 50 social credits"
6. **Gentrification Progress Bar:** Full-width bar showing building gentrification index 0-100%
7. **Eviction Leaderboard widget:** Top 5 tenants closest to eviction with odds

Reference mockups: `stitch_remix_of_eviction_warning_modal/dystopian_rental_dashboard/code.html` and `stitch_remix_of_eviction_warning_modal/corporate_control_center_dashboard/code.html`

**Commit:**
```bash
git commit -m "feat: add tenant dashboard with scores, payments, notifications, ads"
```

---

### Task 7: Frontend — Marketplace Page

**Files:**
- Create: `frontend/src/app/marketplace/page.tsx`
- Create: `frontend/src/components/marketplace/UnitCard.tsx`
- Create: `frontend/src/components/marketplace/UnitDetailModal.tsx`
- Create: `frontend/src/components/marketplace/KlarnaCheckout.tsx`
- Create: `frontend/src/components/marketplace/FilterBar.tsx`

**Description:**

Zillow-style apartment marketplace:

1. **Filter Bar:** Price range slider, sector dropdown, sort by (price, radiation, oxygen quality)
2. **Unit Grid:** Cards showing apartment name, sector, level, monthly rent, radiation level badge, oxygen quality indicator, availability status. Use placeholder images or colored gradient backgrounds.
3. **Unit Detail Modal:** Click a card → modal with full stats, resource metrics, resident count, larger image area
4. **Klarna Checkout Flow:** "Rent with Klarna" button → step-by-step simulated checkout:
   - Step 1: Choose installment plan (3/6/12 months) with Klarna pink branding
   - Step 2: "Verifying your Social Credit Score..." loading animation
   - Step 3: "Approved! Your monthly payment: $X" with confetti or dystopian congratulations
   - Creates the application via `POST /api/units/{id}/apply`

Reference mockup: `stitch_remix_of_eviction_warning_modal/unit_selection_interface/code.html`

**Commit:**
```bash
git commit -m "feat: add marketplace with unit cards, detail modal, Klarna checkout"
```

---

### Task 8: Frontend — AI Landlord Voice Page

**Files:**
- Create: `frontend/src/app/landlord/page.tsx`
- Create: `frontend/src/components/landlord/VoiceVisualizer.tsx`
- Create: `frontend/src/components/landlord/PushToTalk.tsx`

**Description:**

Full-screen voice-only interface:

1. **Dark full-screen layout** — no sidebar on this page, just back button in corner
2. **Voice Visualizer:** Animated waveform/pulsing circle in center of screen. Pulses when landlord is "speaking." Idle state is a subtle glow. Use CSS animations with audio analysis if possible, or simple pulsing animation synced to playback state.
3. **Push-to-Talk Button:** Large circular button at bottom. Hold to record audio. Release to send. Visual states: idle, recording (red pulse), processing (loading spinner), playing (waveform active).
4. **Audio Pipeline:**
   - On release: get audio blob from MediaRecorder
   - POST to `/api/chat/voice` as multipart form data
   - Receive audio response (binary)
   - Play through Audio API
   - No text displayed anywhere — pure voice interaction
5. **Status indicator:** Small text at top: "LANDLORD AI v2.4.1 — LISTENING" / "PROCESSING" / "SPEAKING"

The page should feel ominous and minimal. Dark background, single centered visual element, one interaction button.

**Commit:**
```bash
git commit -m "feat: add voice-only AI landlord page with push-to-talk and visualizer"
```

---

### Task 9: Frontend — Polymarket Betting Page

**Files:**
- Create: `frontend/src/app/markets/page.tsx`
- Create: `frontend/src/components/markets/MarketCard.tsx`
- Create: `frontend/src/components/markets/BetModal.tsx`
- Create: `frontend/src/components/markets/WalletWidget.tsx`

**Description:**

Polymarket-style prediction market for eviction betting:

1. **Wallet Widget:** Top of page showing simulated crypto balance (fake ETH/USDC). Starts at 1000 credits.
2. **Market Cards Grid:** Each card shows:
   - Question: "Will CIT-7291 be evicted this month?"
   - YES/NO prices (probabilities) displayed as percentages
   - Volume traded
   - Category badge
   - "Bet" button
3. **Bet Modal:** Click bet → modal with:
   - YES/NO toggle
   - Amount input (in crypto credits)
   - Potential payout calculation
   - "Place Bet" confirmation
   - Uses `POST /api/markets/{id}/bet`
4. **Eviction Odds Section:** Shows how odds are calculated — missed payments count, social credit score, total debt. Transparent but dystopian.

Reference mockup: `stitch_remix_of_eviction_warning_modal/ai_landlord_markets/code.html` (market sidebar section)

**Commit:**
```bash
git commit -m "feat: add Polymarket-style eviction betting page"
```

---

## Phase 3: Extras

### Task 10: Frontend — Eviction Leaderboard Page

**Files:**
- Create: `frontend/src/app/leaderboard/page.tsx`
- Create: `frontend/src/components/leaderboard/LeaderboardTable.tsx`

**Description:**

Full-page leaderboard ranking tenants by eviction odds:

1. **Table columns:** Rank, Citizen ID, Name, Missed Payments, Social Credit Score, Eviction Odds (%), Total Owed
2. **Color coding:** Top 3 rows highlighted red. Green for low-risk tenants.
3. **"Bet on this tenant" link** per row → navigates to markets page
4. Fetches from `GET /api/markets/leaderboard`

**Commit:**
```bash
git commit -m "feat: add eviction leaderboard page"
```

---

### Task 11: Tenant Ratings + Gentrification Polish

**Files:**
- Create: `frontend/src/components/dashboard/RatingModal.tsx`
- Modify: `frontend/src/app/dashboard/page.tsx` (add rate-a-neighbor button)

**Description:**

1. **Rating Modal:** "Rate Your Neighbor" button on dashboard opens modal. Select neighbor from dropdown, rate noise/cleanliness/loyalty on 1-5 stars. Submit via `POST /api/ratings/{user_id}`.
2. **Social credit impact:** Rating submission returns updated scores visible on dashboard refresh.

**Commit:**
```bash
git commit -m "feat: add tenant rating modal and social credit impact"
```

---

### Task 12: Final Integration + Polish

**Files:**
- Various frontend components (fix API wiring, error states, loading states)
- `frontend/src/app/layout.tsx` (ensure auth provider wraps all routes)

**Description:**

1. Verify all pages load data correctly from backend
2. Add loading skeletons for all pages
3. Add error states (connection failed, unauthorized redirect)
4. Ensure time bar updates data across pages when day/month advanced
5. Test full flow: login → dashboard → marketplace → rent unit → see payments → talk to landlord → bet on markets → check leaderboard
6. Final visual polish pass against mockups

**Commit:**
```bash
git commit -m "feat: integration polish, loading states, error handling"
```

---

## Execution Order & Parallelism

```
Phase 1 (sequential):
  Task 1 (schemas) → Task 2 (new models) → Task 3 (auth) → Task 4 (all routers)
  Task 5 (frontend shell) — can run in parallel with Tasks 1-4

Phase 2 (parallel — 4 agents):
  Task 6 (dashboard)  ┐
  Task 7 (marketplace) ├── all in parallel after Phase 1
  Task 8 (landlord)    │
  Task 9 (markets)     ┘

Phase 3 (sequential):
  Task 10 (leaderboard) → Task 11 (ratings) → Task 12 (polish)
```

## Key Reference Files

- **ORM Models:** `backend/models/*.py`
- **TypeScript Types:** `frontend/src/lib/types.ts`
- **Seed Data:** `backend/seed.py`
- **Design Tokens:** `frontend/tailwind.config.ts`
- **HTML Mockups:** `stitch_remix_of_eviction_warning_modal/*/code.html`
- **API Client:** `frontend/src/lib/api.ts`
