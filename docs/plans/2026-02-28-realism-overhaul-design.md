# Landly Realism Overhaul Design

**Goal:** Transform Landly from overtly satirical to subtly unsettling. Clinical light theme, corporate language, realistic apartment data, functional UI, and soulless Humaaans illustrations everywhere.

## Theme & Visual Identity

**Light theme — clinical white + soft blue:**
- Background: #FAFBFC (off-white)
- Cards: #FFFFFF with #E5E7EB borders
- Secondary surfaces: #F3F4F6
- Primary accent: #3B82F6 (soft blue)
- Text primary: #111827
- Text secondary: #6B7280
- Danger/overdue: #EF4444
- Success/paid: #10B981
- Klarna pink: #FFB3C7 (keep)
- Font: Space Grotesk (keep, lighter weights)

**Humaaans corporate illustrations:**
- Assets at: `Flat Assets/Humaaans/` (8 sitting, 24 standing poses in png/svg/@2x)
- Copy these to `frontend/public/illustrations/`
- Use on: login page, dashboard empty states, marketplace header, sidebar footer, ad banners, leaderboard page, 404 page
- The corporate art reinforces "this is a normal app"

## Terminology Rebrand

| Current | New |
|---------|-----|
| Citizen ID | Resident ID |
| Social Credit Score | Community Score |
| Citizen Authentication | Resident Login |
| "Compliance is comfort" | "Modern Living, Simplified" |
| Citizen Housing Portal | Landly — Modern Living, Simplified |
| Eviction Leaderboard | Lease Risk Assessment |
| "Bet" on tenants | "Take a position" on lease outcomes |
| Bronze/Silver/Gold/Platinum tiers | Standard / Plus / Premium / Elite |
| CIT-7291 | Keep format but change prefix: RES-7291 |
| "LANDLORD AI" | "Landly Assistant" |
| EVICTION WATCH | Lease Risk Monitor |
| "The house always wins" | Remove entirely |
| "Debt Trap" installment label | "Extended Plan" |
| Passive-aggressive notices | Mix: most corporate-polite, some subtly unsettling |

## Unit Listings — Realistic Stats

Remove: radiation_level, oxygen_quality, altitude, smart_lock_status (as visible stats)

Replace with realistic apartment data:
- sqft, bedrooms, bathrooms, floor
- pet_policy ("Pets Welcome" / "No Pets")
- parking ("Included" / "$75/mo" / "None")
- laundry ("In-Unit" / "Shared")
- year_built
- "Smart Home Enabled" (surveillance — presented as a feature)
- "Noise Monitoring" (always listening — presented as community benefit)
- "Community Score Required: 650+" (gatekeeping)

## Dashboard Changes

Remove:
- Resource metrics (oxygen/water/power/noise bars)
- Overtly dystopian language
- CRT scan lines from landlord page

Add/Change:
- Light, clean card layout with Humaaans illustrations
- Community Score replaces Social Credit Score
- Credit Score stays (realistic)
- Payment table with actual Klarna installments showing after unit rental
- Notifications: mix of corporate-polite and subtly unsettling
- Ad banners: realistic fintech/proptech style with Humaaans

## Markets — Eviction Prediction Market

Keep the prediction market format but with real backing data:
- Each market shows a specific tenant with: missed payments count, total debt, Community Score
- Odds calculated from those real stats
- Language: "Take a position" not "Bet", "Lease outcome" not "Eviction"
- Wallet uses "LDLY credits" (keep)
- Market cards show transparent risk factors

## Notifications — Corporate Tone (Mixed)

Mostly corporate-polite, some subtly unsettling:
- "Your rent payment has been processed. Thank you for being a valued resident."
- "Noise levels in your unit exceeded community guidelines at 3:47 AM. A courtesy reminder has been logged."
- "Your Community Score has been updated based on recent activity. View details."
- "A maintenance request has been received. Our team will respond within the standard service window."
- "We noticed your payment was 3 days late. A small convenience fee has been applied to help you stay on track."
- Subtly unsettling: "Your recent visitor was logged by the Smart Home system. No action required at this time."
- Subtly unsettling: "Your lease renewal assessment has been automatically initiated. We look forward to continuing our partnership."

## Functional Fixes

1. Time simulation bar — advance day/month buttons work and refresh dashboard data
2. Klarna installments appear in payment table after renting a unit
3. All buttons have real actions — no dead-end UI
4. CORS fix already committed

## Ad Banners — Corporate Realistic

With Humaaans illustrations:
- "Flexible payments with Klarna. Because life happens."
- "Your Community Score matters. Learn how to improve it."
- "Refer a friend to Landly. Earn $50 credit."
- "Smart Home features included with every unit. Peace of mind, built in."

## Files Affected

### Backend Model Changes
- `backend/models/unit.py` — replace radiation/oxygen/altitude with sqft/bedrooms/bathrooms/floor/pet_policy/parking/laundry/year_built/noise_monitoring/smart_home
- `backend/seed.py` — update all seed data with realistic apartment data, rebrand terminology
- `backend/routers/admin.py` — update notification templates to corporate tone
- `backend/schemas/unit.py` — update UnitResponse fields

### Frontend Theme
- `frontend/tailwind.config.ts` — flip to light theme colors
- `frontend/src/app/globals.css` — light mode CSS variables
- `frontend/src/app/layout.tsx` — remove `dark` class from html

### Frontend Components (every page)
- All pages: light theme styling, terminology rebrand
- Copy Humaaans to `frontend/public/illustrations/` and add `<img>` tags throughout
- Dashboard: remove resource metrics, update cards
- Marketplace: realistic unit stats, update cards
- Markets: eviction data display, soften language
- Leaderboard: rebrand to "Lease Risk Assessment"
- Landlord: remove CRT effects, rebrand to "Landly Assistant"
- Login: light theme, add Humaaan illustration
- Sidebar: light theme, update labels
- TimeBar: ensure buttons work properly

### Frontend Types
- `frontend/src/lib/types.ts` — update Unit interface fields
