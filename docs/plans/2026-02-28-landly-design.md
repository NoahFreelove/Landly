# Landly Design Document

A satirical dystopian apartment management app. Political statement and dark humor hackathon project.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Python FastAPI, SQLAlchemy ORM, SQLite |
| AI Brain | Claude Haiku (via Anthropic API) — landlord response generation |
| Speech-to-Text | OpenAI Whisper API |
| Text-to-Speech | OpenAI TTS API |
| Auth | JWT tokens via python-jose |

## Environment Variables (backend/.env)

```
ANTHROPIC_API_KEY=...    # Claude Haiku for landlord AI
OPENAI_API_KEY=...       # Whisper STT + TTS (audio only, no content generation)
JWT_SECRET=...
```

## Pages / Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page (exists) |
| `/login` | Citizen login |
| `/dashboard` | Tenant dashboard — metrics, scores, payments, ads, notifications |
| `/marketplace` | Zillow-style apartment listings with Klarna rent flow |
| `/landlord` | Voice-only AI landlord interface |
| `/markets` | Polymarket-style eviction betting |
| `/leaderboard` | Public eviction leaderboard |

## API Endpoints

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /api/auth/login`, `GET /api/auth/me` |
| Dashboard | `GET /api/dashboard` |
| Units | `GET /api/units`, `GET /api/units/{id}`, `POST /api/units/{id}/apply` |
| Payments | `GET /api/payments/summary`, `POST /api/payments/pay`, `GET /api/payments/eviction-status` |
| Chat/Voice | `POST /api/chat/voice` (audio in, audio out), `POST /api/chat/send` (text SSE), `GET /api/chat/history` |
| Markets | `GET /api/markets`, `POST /api/markets/{id}/bet`, `GET /api/markets/leaderboard` |
| Notifications | `GET /api/notifications` |
| Ratings | `POST /api/ratings/{user_id}`, `GET /api/ratings/{user_id}` |
| Admin/Time | `POST /api/admin/advance-day`, `POST /api/admin/advance-month`, `GET /api/admin/current-date` |

## Voice Landlord Pipeline

```
User speaks → browser MediaRecorder captures audio blob
→ POST /api/chat/voice (sends audio file)
→ OpenAI Whisper (transcribes to text — no content generation)
→ Claude Haiku (generates landlord response — the actual brain)
→ OpenAI TTS (converts response text to audio — no content generation)
→ audio stream back to browser → plays audio
```

OpenAI is used purely as a speech codec. Claude Haiku handles all reasoning and content generation.

## Feature Details

### Marketplace (Zillow-style)
- Grid of apartment cards: photos, rent price, sector, radiation level, oxygen quality
- Filter bar: price range, sector, availability
- Click listing → detail modal with full stats
- "Rent with Klarna" button → simulated Klarna checkout (installment picker: 3/6/12 months, pink Klarna branding, fake approval)
- Apartments only, no homes

### Dashboard
- Top bar: current unit name, tenant tier badge, simulated date
- Prominent cards: Credit Score (300-850), Social Credit Score (0-1000), Interest Rate
- Outstanding payments table with Klarna branding
- Passive-aggressive landlord notifications feed
- Satirical ad banners ("Upgrade to Platinum — breathe premium oxygen!")
- Gentrification Progress Bar (building-wide metric)
- Eviction Leaderboard widget (top 5 closest to eviction)

### AI Landlord (Voice Only)
- Full-screen dark interface, no text — pulsing waveform/visualizer
- Push-to-talk button (hold to record)
- System prompt: knows local tenant laws, always acts in worst interest of tenant, maximizes legal delays, passive-aggressive
- History stored in DB but not displayed (voice-only UX)

### Polymarket (Eviction Betting)
- List of active markets — each tenant has eviction odds
- Odds from: missed payments, social credit score, overdue debts
- Bet YES/NO on "Will CIT-7291 be evicted this month?"
- Simulated crypto wallet (fake, no blockchain)
- Markets resolve monthly on time advance

### Tenant Rating System
- Rate neighbors on noise, cleanliness, loyalty
- Ratings affect Social Credit Score
- Displayed on dashboard

### Gentrification Progress Bar
- Building-wide index on dashboard
- Rises as rent increases and tenants get evicted

### Notification Feed
- Auto-generated passive-aggressive notices
- Generated on time advance
- Examples: "Your breathing was detected at 3AM", "Rent increase effective tomorrow"

### Eviction Leaderboard
- Ranked list on `/leaderboard` page
- Widget on dashboard showing top 5
- Ties into Polymarket betting odds

### Time Simulation (Floating Bar)
- Sticky bar at bottom of screen on all pages
- Shows current simulated date
- "Advance Day" and "Advance Month" buttons
- Time advance triggers: interest accrual, payment due dates, market resolutions, new notifications, gentrification index update, eviction recalculation

## Development Approach

Parallel development using agents in git worktrees:

- **Phase 1:** Backend API routes + Frontend shell/layout/navigation (parallel)
- **Phase 2:** Feature pages built in parallel (Dashboard, Marketplace, AI Landlord, Polymarket)
- **Phase 3:** Integration + extras (time sim bar, leaderboard, notifications, ratings, gentrification bar)

## Existing Project State

Already built:
- Full SQLAlchemy ORM models (User, Payment, KlarnaDebt, Market, MarketBet, Unit, ChatMessage, ResourceMetric)
- SQLite database seeded with test data (3 users, 5 units, payments, markets, bets, chat messages, resources)
- Frontend design system (Tailwind config, colors, fonts)
- TypeScript type definitions
- API client skeleton
- Landing page
- 5 HTML/CSS mockups for visual reference
