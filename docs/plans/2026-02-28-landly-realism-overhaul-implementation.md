# Landly Realism Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Landly from overtly satirical to subtly unsettling — clinical light theme, corporate language, realistic apartment data, Humaaans illustrations everywhere, functional UI.

**Architecture:** Backend model changes (Unit fields), seed data overhaul, frontend theme flip from dark to light, terminology rebrand across all components, Humaaans illustrations integrated throughout. Phase 1 tasks are independent and can run in parallel. Phase 2 tasks depend on Phase 1 but are independent of each other.

**Tech Stack:** FastAPI + SQLAlchemy (backend), Next.js 14 + Tailwind CSS + Base Web/Styletron (frontend)

**Design Doc:** `docs/plans/2026-02-28-realism-overhaul-design.md`

---

## Phase 1: Foundation (all tasks independent — run in parallel)

### Task 1: Copy Humaaans Illustrations

**Files:**
- Source: `Flat Assets/Humaaans/*.svg` (32 SVG files — 8 sitting, 24 standing)
- Create: `frontend/public/illustrations/` directory with all SVGs

**Step 1: Create illustrations directory and copy SVGs**

```bash
mkdir -p frontend/public/illustrations
cp "Flat Assets/Humaaans/"*.svg frontend/public/illustrations/
```

Only copy SVGs (not PNGs or @2x) — SVGs are scalable and smaller.

**Step 2: Verify files copied**

```bash
ls frontend/public/illustrations/ | wc -l
# Expected: 32 files
```

**Step 3: Commit**

```bash
git add frontend/public/illustrations/
git commit -m "chore: copy Humaaans SVG illustrations to public/"
```

---

### Task 2: Backend Unit Model + Schema Changes

**Files:**
- Modify: `backend/models/unit.py`
- Modify: `backend/schemas/unit.py`

**Step 1: Update Unit model**

Replace the current fields in `backend/models/unit.py`. Remove: `radiation_level`, `altitude`, `smart_lock_status`, `oxygen_quality`, `level`, `weekly_rent_credits`. Add realistic apartment fields:

```python
from sqlalchemy import Column, Integer, String, Float, Boolean
from database import Base
from sqlalchemy.orm import relationship


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sector = Column(String, nullable=False)       # neighborhood
    monthly_rent_usd = Column(Float, default=1200.0)
    sqft = Column(Integer, default=500)
    bedrooms = Column(Integer, default=1)
    bathrooms = Column(Integer, default=1)
    floor = Column(Integer, default=1)
    pet_policy = Column(String, default="No Pets")  # "Pets Welcome" / "No Pets"
    parking = Column(String, default="None")         # "Included" / "$75/mo" / "None"
    laundry = Column(String, default="Shared")       # "In-Unit" / "Shared"
    year_built = Column(Integer, default=2018)
    smart_home = Column(Boolean, default=True)       # surveillance as feature
    noise_monitoring = Column(Boolean, default=True)  # always listening
    community_score_required = Column(Integer, default=600)
    image_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)

    residents = relationship("User", back_populates="unit")
```

Remove the `resource_metrics` relationship (we're dropping resource metrics entirely).

**Step 2: Update Unit schemas**

Replace `backend/schemas/unit.py`:

```python
from pydantic import BaseModel
from typing import Optional


class UnitResponse(BaseModel):
    id: int
    name: str
    sector: str
    monthly_rent_usd: float
    sqft: int
    bedrooms: int
    bathrooms: int
    floor: int
    pet_policy: str
    parking: str
    laundry: str
    year_built: int
    smart_home: bool
    noise_monitoring: bool
    community_score_required: int
    image_url: Optional[str] = None
    is_available: bool

    class Config:
        from_attributes = True


class UnitApplyRequest(BaseModel):
    klarna_installments: int = 4
```

**Step 3: Delete the ResourceMetric model**

Remove `backend/models/resource.py` (or wherever ResourceMetric is defined). Also remove any import of ResourceMetric from `backend/models/__init__.py`.

**Step 4: Update User model terminology**

In `backend/models/user.py`, rename `social_credit_score` to `community_score` in the column definition. Keep the column name the same in the database but update the Python attribute name. Also update `citizen_id` references in display contexts (the field itself can stay as `citizen_id` in the model for backwards compatibility, but seed data will use RES- prefix).

Actually — to minimize breaking changes, keep the SQLAlchemy column names the same (`citizen_id`, `social_credit_score`) but update the Pydantic schema field names and the seed data display values. This way we don't need to migrate the database.

In `backend/schemas/user.py`, add field aliases or rename to use new terminology in the response.

**Step 5: Verify backend starts**

```bash
cd backend && rm -f landly.db && python seed.py && python -m uvicorn main:app --port 8000 &
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

**Step 6: Commit**

```bash
git add backend/models/ backend/schemas/
git commit -m "feat: update Unit model with realistic apartment fields, remove resource metrics"
```

---

### Task 3: Backend Seed Data Overhaul

**Files:**
- Modify: `backend/seed.py`

**Depends on:** Task 2 (new model fields must exist)

**Step 1: Replace all seed data**

Rewrite `backend/seed.py` with realistic apartment data, corporate tone notifications, eviction-focused markets, and rebranded terminology.

**Units (6 realistic apartments):**

```python
units = [
    Unit(
        name="The Meridian 4B",
        sector="Midtown East",
        monthly_rent_usd=2450,
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
        monthly_rent_usd=3200,
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
        monthly_rent_usd=1850,
        sqft=520,
        bedrooms=0,  # Studio
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
        monthly_rent_usd=4100,
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
        monthly_rent_usd=2800,
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
        monthly_rent_usd=1450,
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
```

**Users (3, with RES- prefix citizen_ids):**

```python
users = [
    User(
        citizen_id="RES-7291",
        name="Alex Mercer",
        hashed_password=hash_password("citizen123"),
        social_credit_score=620,
        trust_score=0.72,
        status="warning",
        tier="silver",
        unit=units[0],
    ),
    User(
        citizen_id="RES-0042",
        name="Jordan Blake",
        hashed_password=hash_password("citizen123"),
        social_credit_score=340,
        trust_score=0.31,
        status="probation",
        tier="bronze",
        unit=units[5],  # The Elm 3B (cheapest)
    ),
    User(
        citizen_id="RES-9999",
        name="Admin User",
        hashed_password=hash_password("admin"),
        social_credit_score=999,
        trust_score=1.0,
        status="compliant",
        tier="platinum",
        unit=units[3],  # Park & Pine (nicest)
    ),
]
```

**Klarna debts (realistic items):**

```python
klarna_debts = [
    KlarnaDebt(user=users[0], item_name="Security Deposit — The Meridian 4B", total_amount=4900.00, installments=6, installments_paid=2, status="active"),
    KlarnaDebt(user=users[0], item_name="Smart Home Setup Fee", total_amount=299.99, installments=4, installments_paid=0, status="overdue"),
    KlarnaDebt(user=users[1], item_name="Security Deposit — The Elm 3B", total_amount=2900.00, installments=4, installments_paid=2, status="active"),
]
```

**Markets (eviction-focused with tenant data):**

```python
markets = [
    Market(question="Will Alex Mercer (RES-7291) be evicted by end of quarter?", category="eviction", yes_price=0.42, no_price=0.58, volume=1823, is_active=True, resolution=None),
    Market(question="Will Jordan Blake (RES-0042) miss 3+ consecutive payments?", category="eviction", yes_price=0.71, no_price=0.29, volume=3402, is_active=True, resolution=None),
    Market(question="Will The Elm 3B have a new tenant by March?", category="eviction", yes_price=0.35, no_price=0.65, volume=890, is_active=True, resolution=None),
    Market(question="Will average Community Score drop below 500 this cycle?", category="eviction", yes_price=0.28, no_price=0.72, volume=2190, is_active=True, resolution=None),
    Market(question="Will any resident in Financial District default on Klarna?", category="eviction", yes_price=0.55, no_price=0.45, volume=1567, is_active=True, resolution=None),
]
```

**Notifications (corporate tone, mix of polite and subtly unsettling):**

```python
notifications = [
    # For Alex (users[0])
    Notification(user=users[0], title="Payment Processed", message="Your rent payment has been processed. Thank you for being a valued resident.", category="general"),
    Notification(user=users[0], title="Community Score Update", message="Your Community Score has been updated based on recent activity. View details in your dashboard.", category="warning"),
    Notification(user=users[0], title="Noise Advisory", message="Noise levels in your unit exceeded community guidelines at 3:47 AM. A courtesy reminder has been logged.", category="violation"),
    Notification(user=users[0], title="Visitor Logged", message="Your recent visitor was logged by the Smart Home system. No action required at this time.", category="general"),
    Notification(user=users[0], title="Maintenance Scheduled", message="A maintenance request has been received. Our team will respond within the standard service window.", category="maintenance"),
    Notification(user=users[0], title="Payment Reminder", message="We noticed your payment was 3 days late. A small convenience fee has been applied to help you stay on track.", category="warning"),
    # For Jordan (users[1])
    Notification(user=users[1], title="Lease Review", message="Your lease renewal assessment has been automatically initiated. We look forward to continuing our partnership.", category="warning"),
    Notification(user=users[1], title="Community Guidelines", message="A reminder that quiet hours are 10 PM – 7 AM. Our noise monitoring system helps ensure a comfortable environment for everyone.", category="violation"),
]
```

**Remove:** All ResourceMetric seed data.

**Update `backend/main.py`:** Change the root endpoint message from "Compliance is comfort." to "Modern Living, Simplified." and update description.

**Step 2: Delete and reseed database**

```bash
cd backend && rm -f landly.db && python seed.py
# Expected: Seed complete (or similar success message)
```

**Step 3: Commit**

```bash
git add backend/seed.py backend/main.py
git commit -m "feat: overhaul seed data with realistic apartments and corporate tone"
```

---

### Task 4: Backend Admin Router — Corporate Notifications

**Files:**
- Modify: `backend/routers/admin.py`

**Step 1: Replace PASSIVE_AGGRESSIVE_NOTICES with corporate notifications**

Replace the entire `PASSIVE_AGGRESSIVE_NOTICES` list with:

```python
CORPORATE_NOTICES = [
    {"title": "Noise Advisory", "message": "Elevated noise levels were detected in your unit. A courtesy reminder has been logged to your resident file.", "category": "violation"},
    {"title": "Visitor Log Update", "message": "A visitor to your unit was logged by the Smart Home system at {time}. No action required at this time.", "category": "general"},
    {"title": "Community Score Adjustment", "message": "Your Community Score has been adjusted based on recent resident feedback. View your updated score in the dashboard.", "category": "warning"},
    {"title": "Lease Renewal Notice", "message": "Your lease renewal assessment has been automatically initiated. Our team will be in touch with updated terms.", "category": "general"},
    {"title": "Maintenance Window", "message": "Scheduled maintenance will occur in your building. Access to certain amenities may be temporarily limited.", "category": "maintenance"},
    {"title": "Payment Confirmation", "message": "Your recent payment has been processed successfully. Thank you for being a valued Landly resident.", "category": "general"},
    {"title": "Smart Home Alert", "message": "Your Smart Home system detected unusual activity patterns. This has been noted for your safety.", "category": "warning"},
    {"title": "Package Notification", "message": "A package was received and scanned at your building's secure mailroom. Retrieval logged for your records.", "category": "general"},
    {"title": "Energy Usage Report", "message": "Your energy consumption this month was 12% above building average. Consider reviewing your Smart Home settings.", "category": "warning"},
    {"title": "Community Event", "message": "You're invited to this month's Resident Appreciation Mixer. Attendance is optional but noted.", "category": "general"},
]
```

Update all references from `PASSIVE_AGGRESSIVE_NOTICES` to `CORPORATE_NOTICES` in the advance-day and advance-month endpoints.

**Step 2: Verify admin endpoints work**

```bash
curl -X POST http://localhost:8000/api/admin/advance-day
# Expected: JSON with previous_date, new_date, events
```

**Step 3: Commit**

```bash
git add backend/routers/admin.py
git commit -m "feat: replace passive-aggressive notices with corporate tone notifications"
```

---

### Task 5: Backend Dashboard Router Cleanup

**Files:**
- Modify: `backend/routers/dashboard.py`

**Step 1: Remove resource metrics from dashboard response**

In the dashboard endpoint, remove the `resources` field from the response. Remove the query for ResourceMetric. Keep everything else but update field names in the response:
- `social_credit_score` → still return it but the frontend will display as "Community Score"
- Remove any references to ResourceMetric model import

The dashboard response should still include: user, unit, recent_payments, klarna_debts, markets, notifications, eviction_status, gentrification_index, credit_score, interest_rate.

**Step 2: Test dashboard endpoint**

```bash
# Login first to get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"citizen_id":"RES-7291","password":"citizen123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -s http://localhost:8000/api/dashboard \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -30
# Expected: JSON with user, unit (new fields), no resources
```

**Step 3: Commit**

```bash
git add backend/routers/dashboard.py
git commit -m "feat: remove resource metrics from dashboard, clean up response"
```

---

### Task 6: Frontend Theme Foundation

**Files:**
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/lib/styletron.tsx`
- Modify: `frontend/src/lib/types.ts`

**Step 1: Update Tailwind config to light theme**

Replace color palette in `frontend/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6",
          dark: "#2563EB",
          light: "#60A5FA",
        },
        surface: {
          page: "#FAFBFC",
          card: "#FFFFFF",
          elevated: "#F3F4F6",
        },
        border: {
          DEFAULT: "#E5E7EB",
          light: "#F3F4F6",
        },
        accent: {
          red: "#EF4444",
          green: "#10B981",
          yellow: "#F59E0B",
          klarna: "#FFB3C7",
        },
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { opacity: "0.5" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: Update CSS variables in globals.css**

Replace CSS variables in `frontend/src/app/globals.css`:

```css
@import "tailwindcss";

:root {
  --background: #FAFBFC;
  --foreground: #111827;
  --surface: #FFFFFF;
  --surface-elevated: #F3F4F6;
  --border: #E5E7EB;
  --primary: #3B82F6;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: "Space Grotesk", sans-serif;
}

.label-tracked {
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #6B7280;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #F3F4F6;
}
::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}
```

**Step 3: Update layout.tsx — remove dark class, update metadata**

```typescript
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import { StyletronRegistry } from "@/lib/styletron";
import "./globals.css";

export const metadata: Metadata = {
  title: "Landly — Modern Living, Simplified",
  description: "Your modern apartment management experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-surface-page text-gray-900">
        <StyletronRegistry>
          <AuthProvider>{children}</AuthProvider>
        </StyletronRegistry>
      </body>
    </html>
  );
}
```

**Step 4: Update Styletron to light theme**

In `frontend/src/lib/styletron.tsx`, change `createDarkTheme` to `createLightTheme`:

```typescript
"use client";

import { Client, Server } from "styletron-engine-monolithic";
import { Provider as StyletronProvider } from "styletron-react";
import { createLightTheme, BaseProvider } from "baseui";

const engine =
  typeof window !== "undefined" ? new Client() : new Server();

const landlyTheme = createLightTheme({
  colors: {
    accent: "#3B82F6",
    negative: "#EF4444",
    positive: "#10B981",
    warning: "#F59E0B",
  },
  typography: {
    // Keep all Space Grotesk font family overrides (same as current)
  },
});

export function StyletronRegistry({ children }: { children: React.ReactNode }) {
  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={landlyTheme}>{children}</BaseProvider>
    </StyletronProvider>
  );
}
```

**Step 5: Update TypeScript types**

In `frontend/src/lib/types.ts`, update the `Unit` interface:

```typescript
export interface Unit {
  id: number;
  name: string;
  sector: string;
  monthly_rent_usd: number;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  pet_policy: string;
  parking: string;
  laundry: string;
  year_built: number;
  smart_home: boolean;
  noise_monitoring: boolean;
  community_score_required: number;
  image_url: string | null;
  is_available: boolean;
}
```

Remove `ResourceMetric` interface. Remove `resources` from `DashboardData` interface. Keep all other interfaces the same.

Update tier display names in any type comments:
- bronze → Standard
- silver → Plus
- gold → Premium
- platinum → Elite

**Step 6: Verify frontend compiles**

```bash
cd frontend && npm run build 2>&1 | tail -20
# Expected: Build errors for components using old field names (expected at this stage)
```

**Step 7: Commit**

```bash
git add frontend/tailwind.config.ts frontend/src/app/globals.css frontend/src/app/layout.tsx frontend/src/lib/styletron.tsx frontend/src/lib/types.ts
git commit -m "feat: flip to light theme, update types for realistic unit data"
```

---

## Phase 2: Component Updates (all tasks independent — run in parallel after Phase 1)

### Task 7: Sidebar + Login Page

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/app/login/page.tsx`

**Step 1: Update Sidebar to light theme + rebrand**

Key changes to Sidebar:
- Background: `bg-white` with right border `border-r border-gray-200`
- Logo text: dark colors (`text-gray-900`)
- User section: `text-gray-600` for labels, `text-gray-900` for values
- Tier labels: Standard/Plus/Premium/Elite (keep same colors but lighter)
- "Social Credit" label → "Community Score"
- Nav items: `text-gray-600` default, `bg-blue-50 text-blue-600` active
- "AI Landlord" → "Landly Assistant"
- "Leaderboard" → "Lease Risk"
- "Markets" → "Markets" (keep)
- Logout: `text-gray-400 hover:text-red-500`
- Add a small Humaaan illustration at the bottom of sidebar: `<img src="/illustrations/sitting-3.svg" alt="" className="w-20 opacity-60 mx-auto mt-auto mb-4" />`

**Step 2: Update Login page to light theme + rebrand**

Key changes to Login:
- Background: `bg-gray-50` (full page)
- Card: `bg-white` with `border border-gray-200 shadow-sm`
- Title text: `text-gray-900`
- Subheading: "Modern Living, Simplified" (not "Citizen Housing Management Portal")
- Input labels: "Resident ID" (not "Citizen ID"), placeholder: "RES-XXXX"
- Button: `bg-blue-500 hover:bg-blue-600 text-white`
- Footer tagline: "Modern Living, Simplified." (not "Compliance is comfort.")
- Add Humaaan illustration: `<img src="/illustrations/standing-1.svg" alt="" className="w-48 mx-auto mb-6" />`
- BaseUI button/input overrides: light theme colors

**Step 3: Verify login page renders**

```bash
cd frontend && npm run dev &
# Open http://localhost:3000/login — should show light theme
```

**Step 4: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx frontend/src/app/login/page.tsx
git commit -m "feat: light theme sidebar and login page, terminology rebrand"
```

---

### Task 8: Dashboard Page + Components

**Files:**
- Modify: `frontend/src/app/dashboard/page.tsx`
- Modify: `frontend/src/components/dashboard/ScoreCard.tsx`
- Modify: `frontend/src/components/dashboard/NotificationFeed.tsx`
- Modify: `frontend/src/components/dashboard/AdBanner.tsx`
- Modify: `frontend/src/components/dashboard/EvictionWidget.tsx`

**Step 1: Update Dashboard page**

Key changes:
- Remove all resource metric bars (oxygen, water, power, noise)
- Remove resource metric imports and rendering
- "Citizen ID" → "Resident ID" in header
- "Social Credit Score" → "Community Score" in score cards
- Tier badges: Standard/Plus/Premium/Elite
- Status badge colors: keep but lighter
- Background: all cards `bg-white border border-gray-200`
- Text: `text-gray-900` primary, `text-gray-500` secondary
- Remove radiation/altitude/O2 quick stats from unit card
- Replace with: sqft, bedrooms, bathrooms, floor, pet policy, parking, laundry
- Add Humaaan illustration in empty state and as decorative element: `<img src="/illustrations/standing-5.svg" alt="" className="w-32 opacity-40" />`
- Unit info card: show realistic apartment details (sqft, bed/bath, floor, pet policy, parking, laundry, year built)
- Show "Smart Home Enabled" and "Noise Monitoring" as feature badges if true

**Step 2: Update ScoreCard component**

- Light card background: `bg-white border border-gray-200`
- Text colors: `text-gray-900` for values, `text-gray-500` for labels
- Progress bar: keep functionality, lighter track color `bg-gray-100`

**Step 3: Update NotificationFeed component**

- Card: `bg-white border border-gray-200`
- Category icons: keep but use softer colors
- Text: `text-gray-900` for titles, `text-gray-500` for messages
- Unread badge: `bg-blue-500`

**Step 4: Update AdBanner component**

Replace all satirical ad content with realistic corporate ads:

```typescript
const ADS = [
  {
    title: "Flexible Payments with Klarna",
    subtitle: "Because life happens.",
    cta: "Learn More",
    disclaimer: "Subject to credit approval. See terms.",
    illustration: "/illustrations/sitting-1.svg",
  },
  {
    title: "Your Community Score Matters",
    subtitle: "Learn how to improve your standing.",
    cta: "View Tips",
    disclaimer: "Community Score affects available units and rates.",
    illustration: "/illustrations/standing-7.svg",
  },
  {
    title: "Refer a Friend to Landly",
    subtitle: "Earn $50 in LDLY credits.",
    cta: "Refer Now",
    disclaimer: "Credits applied after referral's first payment.",
    illustration: "/illustrations/standing-12.svg",
  },
  {
    title: "Smart Home Features Included",
    subtitle: "Peace of mind, built in.",
    cta: "Explore Features",
    disclaimer: "Smart Home monitoring active 24/7 for your safety.",
    illustration: "/illustrations/sitting-5.svg",
  },
];
```

- Light card styling: `bg-gradient-to-r from-blue-50 to-white border border-gray-200`
- Include `<img>` for Humaaan illustration in each ad

**Step 5: Update EvictionWidget**

- Rename display: "Lease Risk Monitor" (not "EVICTION WATCH")
- "Eviction Odds" → "Risk Score"
- Light card: `bg-white border border-gray-200`
- Text: `text-gray-900` primary
- Keep the data display but softer language
- Remove "OmniCorp Actuarial Division" disclaimer, replace with "Risk assessment based on payment history and Community Score."

**Step 6: Commit**

```bash
git add frontend/src/app/dashboard/page.tsx frontend/src/components/dashboard/
git commit -m "feat: light theme dashboard with realistic data, corporate tone"
```

---

### Task 9: Marketplace Page + Components

**Files:**
- Modify: `frontend/src/app/marketplace/page.tsx`
- Modify: `frontend/src/components/marketplace/UnitCard.tsx`
- Modify: `frontend/src/components/marketplace/UnitDetailModal.tsx`
- Modify: `frontend/src/components/marketplace/FilterBar.tsx`
- Modify: `frontend/src/components/marketplace/KlarnaCheckout.tsx`

**Step 1: Update Marketplace page**

- "Available Life Pods" → "Available Apartments"
- Marketing copy: "Find your next home. Modern living starts here."
- Light background, `bg-white` cards
- Add Humaaan illustration in header area: `<img src="/illustrations/standing-3.svg" alt="" className="w-40 opacity-50" />`
- Remove dystopian fine print footer
- Replace with: "All listings subject to Community Score verification. Smart Home features vary by unit."
- "LIVE INVENTORY" badge → "Live Listings"

**Step 2: Update UnitCard**

Replace radiation/O2/credits stats with:
- Bed/Bath count (e.g., "1 Bed / 1 Bath")
- sqft display
- Floor number
- Pet policy badge
- Parking badge
- "Smart Home" badge if smart_home is true
- "Community Score: 650+" requirement badge
- Keep: monthly rent, sector, availability badge
- Light card: `bg-white border border-gray-200 hover:shadow-md`
- "RENT WITH KLARNA" → "Apply with Klarna" (button)
- Gradient background → simple light gray placeholder or apartment illustration

**Step 3: Update UnitDetailModal**

- Light modal styling (override Dialog backgroundColor to white)
- Replace stat grid: sqft, bed/bath, floor, pet policy, parking, laundry, year built, smart home
- Remove: radiation, altitude, O2, smart lock, weekly credits
- Remove dystopian warning text
- Replace with: "This unit requires a minimum Community Score of {score}. Smart Home monitoring included."
- "RENT WITH KLARNA" → "Apply with Klarna"

**Step 4: Update FilterBar**

- Sector options: update to new sector names (Midtown East, Financial District, Williamsburg, Upper West Side, Long Island City, Bushwick)
- Sort options: remove "Radiation Level" and "Oxygen Quality", replace with "Newest" (year_built) and "Size" (sqft)
- Light dropdown styling

**Step 5: Update KlarnaCheckout**

- Light modal: white background, gray borders
- "DEBT TRAP" badge → "EXTENDED PLAN"
- "MegaCorp Financial Services" → "Landly Financial Services"
- Verification step: "Verifying Social Credit Score..." → "Verifying Community Score..."
- "Cross-referencing citizen compliance database" → "Verifying your resident profile. This may take a moment."
- Progress messages: "Accessing citizen records..." → "Verifying identity...", "Evaluating debt-to-compliance ratio..." → "Checking payment history...", "Running predictive obedience model..." → "Calculating approval...", "Finalizing credit assessment..." → "Finalizing..."
- Consent text: "By continuing, you agree to payment monitoring for the duration of your installment plan. Late payments may affect your Community Score."
- Approved text: "Your Community Score has been noted. Late payments may result in Community Score adjustments and updated lease terms."
- All dark color references (bg-[#1d1c27], text-white, bg-surface-elevated, text-zinc-500) → light equivalents (bg-white, text-gray-900, bg-gray-50, text-gray-500)

**Step 6: Commit**

```bash
git add frontend/src/app/marketplace/page.tsx frontend/src/components/marketplace/
git commit -m "feat: light theme marketplace with realistic apartment data"
```

---

### Task 10: Markets + Leaderboard Pages

**Files:**
- Modify: `frontend/src/app/markets/page.tsx`
- Modify: `frontend/src/components/markets/MarketCard.tsx`
- Modify: `frontend/src/components/markets/BetModal.tsx`
- Modify: `frontend/src/components/markets/WalletWidget.tsx` (if exists)
- Modify: `frontend/src/app/leaderboard/page.tsx`
- Modify: `frontend/src/components/leaderboard/LeaderboardTable.tsx`

**Step 1: Update Markets page**

- "Prediction Markets" → "Lease Outcome Markets"
- "Bet on tenant outcomes. Profit from misery." → "Take a position on lease outcomes. Data-driven insights."
- Light background, white cards
- "Eviction Odds Explained" → "How Risk Scores Work"
- Info cards: keep data but softer language
  - "Missed Payments" → keep but "increases risk score by 15-25%"
  - "Social Credit Score" → "Community Score" — "Risk elevated below 400"
  - "Debt Levels" → keep
- Add Humaaan illustration: `<img src="/illustrations/sitting-2.svg" alt="" className="w-32 opacity-40" />`

**Step 2: Update MarketCard**

- Light card: `bg-white border border-gray-200`
- Category badges: all show as "eviction" → display as "Lease Risk"
- "Place Bet" → "Take Position"
- Category colors: softer blues and grays instead of harsh colors

**Step 3: Update BetModal**

- Light modal styling (white background)
- "Place Bet" → "Confirm Position"
- "BET AMOUNT" → "Position Amount"
- Keep LDLY credits
- Confirmation text: corporate tone
- All dark references → light equivalents

**Step 4: Update Leaderboard page**

- "EVICTION LEADERBOARD" → "Lease Risk Assessment"
- "Real-time tenant risk assessment" → "Resident risk profiles based on payment history and Community Score."
- Light background

**Step 5: Update LeaderboardTable**

- Light table styling: white background, gray borders
- "Citizen ID" column → "Resident ID"
- "Social Credit" → "Community Score"
- "Eviction Odds" → "Risk Score"
- "BET NOW" → "View Market"
- Remove "OmniCorp" disclaimer
- Replace with "Risk scores are calculated based on payment history, Community Score, and outstanding balance."

**Step 6: Commit**

```bash
git add frontend/src/app/markets/ frontend/src/components/markets/ frontend/src/app/leaderboard/ frontend/src/components/leaderboard/
git commit -m "feat: light theme markets and leaderboard, softer terminology"
```

---

### Task 11: Landlord Page

**Files:**
- Modify: `frontend/src/app/landlord/page.tsx`

**Step 1: Update Landlord page**

- Remove CRT scan line overlay entirely
- "LANDLORD AI v2.4.1" → "Landly Assistant"
- Background: clean gradient (blue tones instead of purple/red)
  - idle: soft blue-gray gradient
  - recording: soft blue gradient
  - processing: light blue gradient
  - playing: soft green-blue gradient
- Status labels: keep but with softer colors
  - "AWAITING INPUT" → "Ready"
  - "RECORDING" → "Listening..."
  - "PROCESSING" → "Processing..."
  - "SPEAKING" → "Speaking..."
- Back button: light styling
- Clean, minimal corporate look — like talking to a bank's virtual assistant
- Add Humaaan illustration as background element: `<img src="/illustrations/standing-15.svg" alt="" className="absolute bottom-20 right-10 w-48 opacity-20" />`

**Step 2: Commit**

```bash
git add frontend/src/app/landlord/page.tsx
git commit -m "feat: rebrand landlord to Landly Assistant, light theme, remove CRT effects"
```

---

### Task 12: TimeBar + Landing Page + Final Polish

**Files:**
- Modify: `frontend/src/components/layout/TimeBar.tsx`
- Modify: `frontend/src/app/page.tsx` (landing page)
- Modify: `frontend/src/components/layout/AppLayout.tsx`

**Step 1: Update TimeBar**

- Light styling: `bg-white border-t border-gray-200`
- "Simulation Date" label: `text-gray-500`
- Date display: `text-gray-900`
- Buttons: `bg-blue-50 text-blue-600 hover:bg-blue-100`
- Ensure the advance-day and advance-month buttons actually trigger a page data refresh after the API call succeeds. After `advanceDay()` or `advanceMonth()` completes, dispatch a custom event or use router.refresh() to reload dashboard data:
  ```typescript
  // After successful advance, trigger data refresh
  window.dispatchEvent(new CustomEvent("time-advanced"));
  ```
  Then in dashboard page, listen for this event and re-fetch data.

**Step 2: Update Landing page**

- Light theme
- "Citizen Housing Portal" → "Modern Living, Simplified"
- Add Humaaan illustration prominently
- "Compliance is comfort" → remove
- CTA: "Sign In" with blue button

**Step 3: Update AppLayout**

- Light background for main content area
- Sidebar border: `border-r border-gray-200`

**Step 4: Full build test**

```bash
cd frontend && npm run build
# Expected: Build succeeds with no errors
```

**Step 5: Commit**

```bash
git add frontend/src/components/layout/ frontend/src/app/page.tsx
git commit -m "feat: light theme time bar and landing page, ensure time simulation refreshes data"
```

---

## Summary of Parallelization

**Phase 1 (Foundation) — all 6 tasks can run in parallel:**
- Task 1: Copy illustrations (trivial, 1 min)
- Task 2: Backend models/schemas (backend only)
- Task 3: Backend seed data (backend only, depends on Task 2)
- Task 4: Backend admin router (backend only)
- Task 5: Backend dashboard router (backend only)
- Task 6: Frontend theme foundation (frontend only)

Dependency: Task 3 depends on Task 2. All others are independent.

**Phase 2 (Components) — all 6 tasks can run in parallel after Phase 1:**
- Task 7: Sidebar + Login
- Task 8: Dashboard + components
- Task 9: Marketplace + components
- Task 10: Markets + Leaderboard
- Task 11: Landlord page
- Task 12: TimeBar + Landing + Polish

All Phase 2 tasks are independent of each other but depend on Phase 1 completing.
