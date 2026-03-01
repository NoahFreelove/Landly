# Landly — Citizen Housing Management Portal

A satirical dystopian apartment management app featuring an AI landlord, prediction markets, debt surveillance, and a unit marketplace. Think corporate property management software designed by an authoritarian regime — dark humor wrapped in a clean, professional UI.

## Concept

Landly imagines a near-future where tenants are "residents" managed by an AI landlord system. Every aspect of housing is gamified, surveilled, and monetized:

- **Community Scores** determine your housing tier and lock access to better units
- **AI Landlord** negotiates rent via voice or text chat (powered by Claude)
- **Prediction Markets** let you bet on dystopian outcomes ("Will average Community Score drop below 500?")
- **Klarna-style debt** fragments everything into installment plans you can never escape
- **Smart Home monitoring** and noise detection as "features"
- **Lease Risk tracking** with eviction probability leaderboards

The app is entirely fictional and satirical. No real transactions, surveillance, or AI landlords are involved.

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Total debt hero card, credit/community score gauges with improvement advice, payment history, debt spiral timeline, notifications, gentrification index, lease risk leaderboard |
| **Total Debt & Payments** | Prominent debt display with category breakdown. Pay individual items or make lump-sum payments applied across outstanding debts. AutoPay toggle, Landly Points rewards |
| **AI Landlord Chat** | Streaming chat with a corporate AI persona. Voice input via push-to-talk with audio visualization |
| **Prediction Markets** | Betting on lease outcomes, rent hikes, and building events. Token wallet with top-up. Leaderboard rankings |
| **Unit Marketplace** | Filterable grid of available apartments with real photos, Community Score requirements, and Klarna installment checkout |
| **Notifications** | Categorized feed (warnings, violations, maintenance, general) with per-item dismiss and bulk clear |
| **Rate Your Neighbor** | Star-rating system across noise compliance, cleanliness, and community engagement |
| **Rent Plan Selector** | Choose between payment plan options for your unit |
| **Referral System** | Generate referral codes, earn credits toward installments |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, BaseUI (Uber) |
| **Backend** | Python FastAPI, SQLAlchemy ORM, Pydantic |
| **Database** | SQLite (file-based, zero config) |
| **AI Chat** | Anthropic Claude API (mock responses as fallback) |
| **Auth** | JWT tokens via python-jose |

## Design System

Light theme with a clean corporate aesthetic:

- **Font:** Space Grotesk (300–700)
- **Palette:** Blue primary (`#3B82F6`), off-white backgrounds (`#FAFBFC`), white card surfaces
- **Accents:** Red for danger/eviction, green for compliant, yellow for warnings, Klarna pink (`#FFB3C7`)
- **Style:** Light mode, uppercase tracked labels, rounded cards, subtle borders, Humaaans illustrations

## Project Structure

```
Landly/
├── frontend/               # Next.js app
│   ├── src/
│   │   ├── app/            # Pages: dashboard, marketplace, landlord, markets, leaderboard, login
│   │   ├── components/     # React components organized by feature
│   │   │   ├── dashboard/  # ScoreCard, PaymentTable, TotalDebtCard, PaymentModal,
│   │   │   │               # NotificationFeed, AdBanner, EvictionWidget, RatingModal,
│   │   │   │               # GentrificationBar, DebtSpiralTimeline, RentPlanSelector
│   │   │   ├── marketplace/# UnitCard, UnitDetailModal, FilterBar, KlarnaCheckout
│   │   │   ├── landlord/   # PushToTalk, VoiceVisualizer
│   │   │   ├── markets/    # MarketCard, BetModal, WalletWidget
│   │   │   ├── leaderboard/# LeaderboardTable
│   │   │   └── layout/     # AppLayout, Sidebar, TimeBar
│   │   └── lib/            # API client, types, auth utilities
│   ├── public/             # Humaaans illustrations, Klarna logo
│   ├── tailwind.config.ts  # Design system tokens
│   └── package.json
│
├── backend/                # FastAPI server
│   ├── main.py             # App entry point, CORS, lifespan
│   ├── config.py           # Settings (DB, JWT, API keys)
│   ├── database.py         # SQLAlchemy engine + session
│   ├── seed.py             # Test data (100 users, payments, debts, notifications)
│   ├── models/             # SQLAlchemy ORM models
│   ├── schemas/            # Pydantic request/response schemas
│   ├── routers/            # API route handlers
│   └── services/           # Business logic (auth, AI chat)
│
└── docs/plans/             # Design docs and implementation plans
```

## Getting Started

### Prerequisites

- **Node.js** >= 18.17.0
- **Python** >= 3.10
- **npm**

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Seed the database with test data (100 users)
python seed.py

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the interactive Swagger UI.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Create `backend/.env` for optional configuration:

```env
ANTHROPIC_API_KEY=sk-...    # For AI chat (falls back to mock responses)
JWT_SECRET=your-secret-key  # Change in production
```

### Test Credentials

After running `python seed.py`, the following accounts are available (plus 97 additional generated residents):

| Resident ID | Password | Tier | Status |
|-------------|----------|------|--------|
| `RES-7291` | `citizen123` | Plus (Silver) | Warning |
| `RES-0042` | `citizen123` | Standard (Bronze) | Probation |
| `RES-9999` | `admin` | Elite (Platinum) | Compliant |

All 100 seeded users share the password `citizen123`.

## API Overview

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /api/auth/login` · `GET /api/auth/me` |
| **Dashboard** | `GET /api/dashboard` |
| **Chat** | `POST /api/chat/send` (SSE) · `POST /api/chat/voice` · `GET /api/chat/history` · `DELETE /api/chat/history` |
| **Markets** | `GET /api/markets` · `POST /api/markets/{id}/bet` · `POST /api/markets/wallet/add-tokens` · `GET /api/markets/leaderboard` |
| **Payments** | `GET /api/payments/summary` · `POST /api/payments/pay` · `POST /api/payments/lump-sum` · `GET /api/payments/eviction-status` · `POST /api/payments/select-rent-plan` · `GET /api/payments/active-plans` · `POST /api/payments/autopay` · `GET /api/payments/referral-code` · `POST /api/payments/use-referral` · `GET /api/payments/points` · `POST /api/payments/points/redeem` |
| **Units** | `GET /api/units` · `GET /api/units/{id}` · `POST /api/units/{id}/apply` |
| **Notifications** | `GET /api/notifications` · `POST /api/notifications/read-all` · `POST /api/notifications/{id}/read` |
| **Ratings** | `POST /api/ratings/{user_id}` · `GET /api/ratings/{user_id}` |
| **Simulation** | `GET /api/admin/current-date` · `POST /api/admin/advance-day` · `POST /api/admin/advance-month` |

## License

This project is for educational and satirical purposes.
