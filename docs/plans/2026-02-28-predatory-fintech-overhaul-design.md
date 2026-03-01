# Predatory Fintech Overhaul — Design Document

**Date:** 2026-02-28
**Status:** Approved

## Core Premise

Rent is so expensive that tenants must finance each month's rent through Klarna installment plans. Paying off one month takes 3–12 months, while new rent keeps stacking. The app presents this with cheerful corporate fintech aesthetics — the dissonance between the friendly UI and predatory mechanics IS the satire.

---

## 1. Reworked Rent Payment Model

### Stacking Monthly Installment Plans

Each month's rent automatically becomes a new Klarna installment plan. Rent is not a single payment — it's financed.

**Plan options (chosen at move-in, applied to all future months):**

| Plan Name   | Duration | APR  | Monthly Payment ($2,450 rent) |
|-------------|----------|------|-------------------------------|
| Standard    | 3 months | 18%  | ~$816.67 + interest           |
| Flexible    | 6 months | 24%  | ~$408.33 + interest           |
| Freedom     | 12 months| 35%  | ~$204.17 + interest           |

**Portfolio risk adjustment:** Each additional active plan adds +2% APR to ALL active plans. By month 6 on a Flexible plan, you have 6 active plans and +12% on top of your base rate.

**Full-pay option:** Exists but buried at bottom of plan selector in small text. Clicking triggers: "Are you sure? 94% of residents prefer installments."

### Stacking Example (Flexible Plan, $2,450/month rent)

- Month 1: Plan A created — $408/mo obligation
- Month 2: Plan B created — $816/mo total
- Month 3: Plan C — $1,224/mo total
- Month 6: Plans A–F all active — ~$2,450/mo (caught up to rent cost, but in fragmented debt)
- Month 7: Plan A paid off, Plan G starts — treadmill continues forever

---

## 2. Debt Spiral Timeline (Dashboard Widget)

**Replaces:** Lease Risk Monitor and Gentrification Index (both removed from dashboard).

### Visual Design

- Horizontal timeline spanning next 12 months
- Each active Klarna plan rendered as a colored horizontal bar (start month → payoff month)
- Bars stack vertically to show overlap — visual density = dread
- Color coding: green (on track), yellow (approaching due), red (overdue)
- Monthly obligation line graph overlaid on the bars

### Data Elements

- **Active plans counter:** "You have 4 active payment plans" (Klarna pink badge)
- **Projected debt-free date:** Always visible, always receding. "At your current pace, you'll be debt-free by March 2028! Keep it up!"
- **Quick stats row:** "This month: $1,632 | Next month: $2,040 | Average: $1,836"
- **Confetti animation** when a plan is completed (while 3+ others still run)

### Tone

Aggressively cheerful and encouraging. "You're making progress!" while total debt grows. The widget never shows negative framing.

---

## 3. Late Payment Escalation

Progressive penalties when an installment payment is missed:

| Trigger     | Penalty | Community Score | Notification Tone |
|-------------|---------|-----------------|-------------------|
| Day 0 (due) | $25 late fee per missed installment | — | "Oops! A small convenience fee has been added." |
| Day 3       | +3% APR on overdue plan | -15 | "Friendly reminder. Your rate has been adjusted." |
| Day 7       | +1% APR on ALL plans | -25 | "Extended non-payment may affect housing status." |
| Day 14      | Overdue status, eviction risk meter appears, AI landlord messages you | -50 | "Your account is in arrears. Contact management." |
| Day 30      | Eviction proceedings. All rates maxed at 35%. Remaining balance accelerated (full amount due immediately). | — | "Eviction proceedings have been initiated." |

**Note:** Late fees stack per installment, not per plan. If 4 plans have payments due and all are missed, that's $100 in late fees on day 0.

**Referrer impact:** At day 7, anyone who referred this tenant takes -10 community score ("co-signer responsibility").

**No escape at day 30.** Eviction proceeds without refinance options.

---

## 4. New Features

### 4a. AutoPay Discount Trap

- **Pitch:** "Save 2% on all your plans with AutoPay! Set it and forget it."
- **Reality:** Enabling AutoPay locks all future rent into the 12-month Freedom plan (35% APR minus the 2% = 33% effective)
- **Cancellation penalty:** Disabling AutoPay triggers a "rate adjustment" of +5% APR on all active plans
- **UI:** Toggle on dashboard with "AutoPay Active" badge. Terms & conditions mention the 12-month lock-in in smaller text.

### 4b. Referral Debt Trap

- **Pitch:** "Refer a friend and get $100 off your next installment!"
- **$100 discount** applies to ONE installment payment only, not total debt
- **Referred friend** receives a "welcome bonus" — pre-approved at the highest interest rate (Freedom plan)
- **Co-signer risk:** If the referred friend misses payments, the referrer's community score takes -10 per missed installment
- **UI:** Referral code + tracking on dashboard. Shows "Your referrals" with their payment status.

### 4c. Rent Rewards (Landly Points)

- **Earn rate:** 1 point per dollar paid in installments (not on full-pay)
- **Redemption options:**
  - 10,000 points = +5 community score boost
  - 25,000 points = 0.5% rate reduction on one plan (one-time)
  - 50,000 points = Priority maintenance request
- **Value:** 10,000 points ≈ $5 equivalent (0.05% return rate)
- **UI:** Points balance prominently displayed on dashboard. "You've earned 2,340 points this month!" with progress bars toward next reward.

---

## 5. Payment Flow Rework

### Monthly Rent Plan Selector

When rent is due, a modal appears styled like a SaaS pricing page:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  STANDARD   │  │  FLEXIBLE   │  │   FREEDOM   │
│   3 months  │  │  6 months   │  │  12 months  │
│  $816/mo    │  │  $408/mo    │  │  $204/mo    │
│  18% APR    │  │  24% APR    │  │  35% APR    │
│             │  │ MOST POPULAR│  │ LOWEST PMT  │
│ [Select]    │  │ [Select]    │  │ [Select]    │
└─────────────┘  └─────────────┘  └─────────────┘

                Pay $2,450 in full ›
          (small text, bottom of modal)
```

### Active Plans Dashboard

- List of all active installment plans, each showing:
  - Original rent month (e.g., "January 2026 Rent")
  - Plan type and APR
  - Installments remaining (e.g., "3 of 6 paid")
  - Next payment amount and due date
- **"This month's total"** prominently displayed — sum of all installments due this month
- **"Make a Payment"** button → pay current month's total or select individual plans
- **"Accelerated Payoff"** lump-sum option with copy: "Pay more now to reduce your plans faster. Your future self will thank you!"

---

## 6. Dashboard Changes

### Remove
- Lease Risk Monitor
- Gentrification Index / GentrificationBar

### Add
- Debt Spiral Timeline widget (Section 2)
- AutoPay toggle + badge
- Landly Points balance display
- Referral tracking card

### Keep (updated for stacking model)
- TotalDebtCard — updated to reflect stacking plan totals
- ScoreCard — Community Score, Credit Score, Interest Rate
- EvictionWidget — triggers based on late payment escalation
- PaymentTable — shows individual installment payments
- NotificationFeed — updated copy for new notification types
- AdBanner — add AutoPay and Referral promotions to rotation

---

## Design Principles

1. **The UI never acknowledges the horror.** Every screen is cheerful, encouraging, corporate. The numbers tell the real story.
2. **Lower monthly payments always win in the UI.** The Freedom plan's $204/mo is highlighted despite costing 2x more total.
3. **Engagement is rewarded with worthless incentives.** Points, badges, streaks — all cosmetic.
4. **Social connections are liabilities.** Referrals create financial co-dependency.
5. **Escape is technically possible but practically discouraged.** Full-pay exists but the system fights you.
