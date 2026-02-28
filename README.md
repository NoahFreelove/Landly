# Landly — Citizen Housing Management Portal

A satirical dystopian apartment management app featuring an AI landlord, prediction markets, debt surveillance, and a unit marketplace. Think corporate property management software designed by an authoritarian regime — dark humor meets brutalist UI.

## Concept

Landly imagines a near-future where tenants are "citizens" managed by an AI landlord system. Every aspect of housing is gamified, surveilled, and monetized:

- **Social Credit Scores** determine your housing tier and lock access
- **AI Landlord** negotiates rent increases via chat (using limited "negotiation credits")
- **Prediction Markets** let you bet on dystopian outcomes ("Will rent increase by 15%?")
- **Klarna-style debt** fragments everything into installment plans you can never escape
- **Smart lock overrides** and oxygen quality monitoring as "features"
- **Eviction countdowns** with real-time ticking timers

The app is entirely fictional and satirical. No real transactions, surveillance, or AI landlords are involved.

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Resource metrics (power, water, oxygen, noise), AI sentiment gauge, social credit score, rent charts, Klarna debt widgets |
| **AI Landlord Chat** | Streaming chat interface with a dystopian AI persona. Split-pane layout with market sidebar showing interest trajectories |
| **Prediction Markets** | PolyMarket-style betting on lease outcomes, rent hikes, and building events. Random-walk price simulation |
| **Payments** | Debt breakdown tables, overdue tracking with compounding interest, Klarna installment management |
| **Eviction Modal** | Countdown timer to eviction deadline, payment negotiation, debt summary |
| **Unit Marketplace** | Filterable grid of available units with radiation levels, altitude, sector, and social credit requirements |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Backend** | Python FastAPI, SQLAlchemy ORM |
| **Database** | SQLite (file-based, zero config) |
| **AI Chat** | Anthropic Claude API (mock responses as fallback) |
| **Auth** | JWT tokens via python-jose |

## Design System

Built from custom UI mockups with a surveillance-state aesthetic:

- **Font:** Space Grotesk (300–700)
- **Palette:** Deep purple primary (`#3211d4`), near-black backgrounds (`#131022`), dark surfaces (`#1d1c27`)
- **Accents:** Red for danger/eviction, green for compliant, yellow for warnings, Klarna pink (`#ffb3c7`)
- **Style:** Dark mode only, uppercase tracked labels, brutalist cards, glowing borders

## Project Structure

```
Landly/
├── frontend/               # Next.js app
│   ├── src/
│   │   ├── app/            # App Router pages (login, dashboard, chat, markets, payments, units)
│   │   ├── components/     # React components organized by feature
│   │   ├── lib/            # API client, types, auth utilities
│   │   └── hooks/          # Custom React hooks
│   ├── tailwind.config.ts  # Design system tokens
│   └── package.json
│
├── backend/                # FastAPI server
│   ├── main.py             # App entry point, CORS, lifespan
│   ├── config.py           # Settings (DB, JWT, API keys)
│   ├── database.py         # SQLAlchemy engine + session
│   ├── seed.py             # Test data population
│   ├── models/             # SQLAlchemy ORM models
│   ├── schemas/            # Pydantic request/response schemas
│   ├── routers/            # API route handlers
│   └── services/           # Business logic (AI, interest calc, market sim)
│
└── stitch_remix_of_eviction_warning_modal/  # UI reference mockups (HTML)
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

# Seed the database with test data
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

After running `python seed.py`, the following accounts are available:

| Citizen ID | Password | Tier | Status |
|------------|----------|------|--------|
| `CIT-7291` | `citizen123` | Silver | Warning |
| `CIT-0042` | `citizen123` | Bronze | Probation |
| `CIT-9999` | `admin` | Platinum | Compliant |

## API Overview

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /api/auth/login` · `GET /api/auth/me` |
| **Dashboard** | `GET /api/dashboard` · `GET /api/dashboard/charts/oxygen` · `GET /api/dashboard/charts/rent` |
| **Chat** | `POST /api/chat/send` (SSE) · `GET /api/chat/history` |
| **Markets** | `GET /api/markets` · `POST /api/markets/{id}/bet` · `GET /api/markets/interest-trajectory` |
| **Payments** | `GET /api/payments/summary` · `GET /api/payments/debt-breakdown` · `POST /api/payments/pay` · `GET /api/payments/eviction-status` |
| **Units** | `GET /api/units` · `GET /api/units/{id}` · `POST /api/units/{id}/apply` |

## Reference Mockups

The `stitch_remix_of_eviction_warning_modal/` directory contains the original HTML/CSS mockups that define the visual design:

- `dystopian_rental_dashboard/` — Sidebar navigation, dashboard metrics, charts
- `corporate_control_center_dashboard/` — AI sentiment, PolyMarket widget, Klarna, unit controls
- `ai_landlord_markets/` — Chat interface with market sidebar
- `eviction_warning_modal/` — Payment modal with countdown timer and debt table
- `unit_selection_interface/` — Unit marketplace grid with filters

## License

This project is for educational and satirical purposes.
