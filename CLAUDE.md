# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Radeya** is a SaaS platform for livestock farming management targeted at Indonesian farmers. Core features include:
- Multi-species support (broiler, layer, duck, cattle, goat, breeding)
- Production cycle tracking with financial calculations (HPP, FCR, IP, SR, Hen-Day)
- Per-animal identity tracking (ear tag, RFID, gender, breed, pedigree)
- Inventory management (feed, medicine, equipment)
- Animal treatment history (diagnose, medicine, dosage, withdrawal days)
- Multi-language support (Indonesian, English, Mandarin)
- Multi-tenant organization structure with subscription tiers (FREE / PREMIUM)

**Status:** Pre-production (branch: `pre-production`). Live at radeya-app.vercel.app. MVP phase focus: auth, cloud sync, payment, bug fixes.

---

## Tech Stack & Setup

### Stack
```
Frontend:  Next.js 14.2 (App Router) + React 18.3 + TypeScript + Tailwind CSS
Backend:   Next.js API Routes / Server Actions
Database:  PostgreSQL + Prisma ORM
Auth:      Email + Google OAuth (custom JWT + httpOnly cookie)
Payment:   Midtrans / Xendit (QRIS, e-wallet, VA) — NOT Stripe
Email:     Resend + React Email
i18n:      Multi-language (id, en, zh)
Hosting:   Vercel (frontend), PostgreSQL cloud
```

### Commands

**Installation & Setup:**
```bash
npm install                    # Install dependencies
npm run build                  # Build Next.js (runs prisma generate first)
npx prisma generate          # Generate Prisma client
npx prisma db push           # Sync DB schema (dev mode)
npx prisma studio            # Open Prisma Studio GUI
```

**Development:**
```bash
npm run dev                   # Start dev server (localhost:3000)
npm run lint                  # Run ESLint
npm run build && npm start    # Production build & start
```

**Environment:**
```
.env              (local, in .gitignore)
.env.example      (template, committed)
DATABASE_URL      (PostgreSQL connection string)
NEXTAUTH_SECRET   (JWT secret, 32+ chars)
NEXT_PUBLIC_GOOGLE_CLIENT_ID     (OAuth, frontend-safe)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY  (Payment, frontend-safe)
MIDTRANS_SERVER_KEY              (Payment, server-only)
```

---

## Architecture & Data Model

### Multi-Tenant Organization Model
```
Organization
  ├─ Users[] (MEMBER, ADMIN roles)
  ├─ Cycles[] (production cycles)
  ├─ InventoryItems[] (feed, medicine, equipment)
  └─ subscription: { plan: "FREE"|"PREMIUM", active: bool, endDate }
```

### Production Cycle Structure
```
Cycle
  ├─ name, animal (broiler/layer/duck/cattle/goat/breeding), scale, mode
  ├─ data: JSON (flexible schema per mode — HPP, biaya, panen, penjualan, etc.)
  ├─ AnimalIdentity[] (per-ekor: earTag, RFID, gender, breed, status)
  │   └─ AnimalTreatment[] (treatment history with withdrawal days)
  └─ InventoryUsage[] (feed/medicine consumption per cycle)
```

### Key Model Details
- **User:** Email + password (bcrypt hash) + Google OAuth. Belongs to one Organization.
- **AnimalIdentity:** Tracks individual animals. `status` field tracks ACTIVE/INACTIVE/SOLD/DIED.
- **AnimalTreatment:** Medicine usage with withdrawal days (critical for egg/meat safety).
- **InventoryItem:** Stock tracking with cost per unit and minimum alert threshold.
- **Cycle.data:** JSON object storing flexible cycle data (biaya, panen, produksi, penjualan, etc.) per animal mode.

### Routes & Layers
```
/app
  /(auth)          → login, register, reset password
  /api             → API routes (auth, payments, cycles, inventory)
  /dashboard       → protected routes (cycles, dashboard, settings)

/lib
  /agents          → AI agent integrations (future)
  /i18n            → Multi-language strings
  api.ts           → Fetch wrapper
  feedCalc.ts      → Feed calculation logic (pure functions)
  prisma.ts        → Prisma client singleton
  auth-cookie.ts   → Session/auth helpers
  rate-limit.ts    → Rate limiting (login/register/reset endpoints)

/constants
  feedIngredients.ts   → Feed ingredient database
  feedTargets.ts       → Feed targets per animal type
  strainStandards.ts   → Broiler strain benchmarks (FCR, IP, etc.)
```

---

## Authentication & Authorization

- **Auth mechanism:** Custom JWT cookie (NOT NextAuth despite env var name). Implemented via:
  - `middleware.ts` — verifies `radeya_token` httpOnly cookie using `jose.jwtVerify(secret: NEXTAUTH_SECRET)`, injects `x-user-id`, `x-org-id`, `x-role` headers into API routes
  - `lib/auth-cookie.ts` — `setAuthCookie`/`clearAuthCookie` helpers (httpOnly, sameSite=lax, secure in prod, 7-day maxAge)
  - `app/api/v1/auth/{login,register,logout,google}/route.ts` — Email/Google flows with `SignJWT` token issuance and bcrypt password validation
- **Password:** Bcrypt hashed, stored in User.password.
- **Session:** JWT inside httpOnly `radeya_token` cookie, verified by middleware on every request to `/api/v1/*`.
- **Email Verification:** (To be implemented) Required before full access.
- **Rate Limiting:** Redis-based on `/api/auth/login`, `/api/auth/register`, `/api/auth/reset` to prevent brute force.
- **Organization Context:** All queries filtered by `orgId` (user can only see their org's data).

**Security Checklist:**
- Server Actions check auth before execution.
- All endpoints validate ownership (`orgId` == session user's org).
- Webhook verification for payment provider (Midtrans/Xendit) — verify signature before updating subscription.
- No sensitive data (API keys, passwords) logged.
- Input validation server-side (Zod recommended).

---

## Payment & Subscription

- **Provider:** Midtrans or Xendit (QRIS, GoPay, OVO, Dana, ShopeePay, VA).
- **Tiers:** FREE (1 farm, 2 cycles) vs PREMIUM (unlimited, export, AI features).
- **Flow:** User → Checkout → Midtrans/Xendit → Webhook → Update subscription.status.
- **Webhook:** Must verify signature. Use idempotency keys to prevent double-processing.
- **Data Stored:** Only externalId + status, never store card data (PCI compliance).

---

## Financial Calculations (CRITICAL)

The `feedCalc.ts` module contains pure functions for calculating:
- **HPP (Harga Pokok Penjualan):** Cost per unit, including depreciation & labor.
- **FCR (Feed Conversion Ratio):** Feed consumed / weight gained.
- **IP (Index Produksi):** Production index for layers.
- **SR (Survival Rate):** % animals alive at end of cycle.
- **Hen-Day:** Eggs per 100 hens per day.
- **ADG (Average Daily Gain):** Weight gain per day (beef cattle).

**Important:** These calculations are per-mode (broiler, layer, duck, cattle, goat, breeding). Each has different formulas & inputs. Verify against radeya-2.html or live calculations before changes.

---

## Multi-Language Support

- Strings in `/lib/i18n/` (id.json, en.json, zh.json).
- `LanguageSwitcher` component toggles language in browser.
- Use `useTranslation()` hook in components.
- Default: Indonesian (id).

---

## Recent Work & Known Issues

### Completed (Recent Commits)
1. **Multi-language support** — Indonesian, English, Mandarin.
2. **Google Sign-In** — NextAuth + Google OAuth integrated (check `.env` for CLIENT_ID).
3. **Inventory system** — InventoryItem, InventoryUsage models added.
4. **Security hardening** — Rate limiting, header security.
5. **Version display** — App version in header + changelog.

### Known TODOs (From PRD/MVP)
1. **Email verification** — Required before full access (wajib sebelum launch).
2. **Cloud sync** — ✅ DONE. Cycle/AnimalIdentity/AnimalTreatment/InventoryItem/InventoryUsage fully modeled + CRUD'd via `app/api/v1/*`. `Cycle.data` is an intentional JSON blob (not normalized) for flexible per-mode field storage. Remaining localStorage keys (`radeya_org_id`, `radeya_lang`, per-cycle notif flags) are legitimate client UI state, not sync debt.
3. **Fix bugs:**
   - Duck mode using broiler threshold values (incorrect).
   - HPP calculation missing depresiasi/labor in some modes.
   - Fish mode (if added) — confirm all field logic.
4. **Payment integration** — Midtrans/Xendit checkout flow.
5. **Subscription tier logic** — Enforce FREE vs PREMIUM features (export, multi-farm, etc.).
6. **UI polish** — Design system colors, responsive mobile.

---

## Design System & UI

### Colors (Tailwind + CSS Variables)
```
Primary:    Teal (#0D9488)
Success:    Green (#059669)
Danger:     Red (#dc2626)
Warning:    Yellow (#f59e0b)
Info:       Blue (#1d4ed8)
Female:     Pink (#ec4899)
Background: #F9FAFB
```

### Key Patterns
- **Mobile-first:** Majority users on phone.
- **Simple language:** "Catat, Jual, Untung" (Record, Sell, Profit).
- **Auto-save:** Form inputs save on blur/change.
- **Empty states:** Always show helpful message + icon.
- **Destructive actions:** Confirm dialog before delete.
- **Currency format:** Rp with abbreviations (rb/jt/M for large numbers).

---

## Testing & Code Quality

### Linting
```bash
npm run lint                        # Check ESLint
```

### Manual Testing Checklist
Before commit, verify:
1. **Auth flow:** Email signup/login, Google OAuth, password reset.
2. **Cycle operations:** Create cycle, add records (biaya, panen, etc.), calculate metrik.
3. **Inventory:** Add/update items, track usage.
4. **Animal tracking:** Add animal, edit treatment, view status.
5. **Multi-language:** Switch language, verify UI text updates.
6. **Mobile responsiveness:** Test on phone-sized screen.

---

## Debugging & Common Tasks

### Database Issues
```bash
npx prisma studio              # Visual DB editor
npx prisma db push             # Sync schema to DB
npx prisma migrate dev         # (Use with caution in prod)
```

### Auth Debugging
- Check `.env` for `NEXTAUTH_SECRET`, Google CLIENT_ID.
- Cookies stored in browser (httpOnly, secure).
- Session endpoint: `/api/auth/session`.

### Payment Debugging
- Use **Sandbox mode** (MIDTRANS_IS_PRODUCTION=false).
- Test webhooks locally via Midtrans/Xendit console.
- Check webhook signature verification before processing.

### Performance
- Check Next.js build output for large bundles: `npm run build`.
- Verify Prisma query efficiency (avoid N+1).
- Use Prisma `include`/`select` judiciously.

---

## Branching & Deployment

### Branches
- **main:** Production-ready, deployed to Vercel.
- **pre-production:** Staging, feature-complete but pre-launch.
- **dev:** Development branch for features & bug fixes.

### Deployment
- Pushes to `main` auto-deploy to Vercel.
- Environment secrets (Midtrans keys, DB URL) set in Vercel dashboard.
- Check build logs for SWC parser errors (known issue in older Next.js).

---

## Important Files & Patterns

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Data model & migrations |
| `lib/feedCalc.ts` | Pure calculation functions (test rigorously) |
| `middleware.ts` | JWT cookie verification, org/user header injection |
| `lib/auth-cookie.ts` | Cookie set/clear helpers |
| `app/api/v1/auth/{login,register,logout,google}/route.ts` | Custom auth flows (email, Google, logout) |
| `app/dashboard/...` | Protected dashboard routes |
| `constants/*.ts` | Static reference data (strains, feed targets) |
| `.env` (not committed) | Secrets & local overrides |

---

## Key Decisions & Rationale

1. **PostgreSQL + Prisma** over MongoDB: Relational data (cycles, animals, inventory) fits better.
2. **Next.js App Router** over Pages: Cleaner organization, Server Components.
3. **Midtrans/Xendit** over Stripe: QRIS + e-wallet support for Indonesian users.
4. **Multi-tenant (Organization):** Future growth (koperasi/pengepul managing multiple farms).
5. **Per-animal identity:** Enable AI diagnostics & traceability (future feature).

---

## Tips for Working Here

1. **Always read PRD/ARCHITECTURE/DESIGN/SECURITY docs** before major changes.
2. **Keep calculations in `/lib/calc` as pure functions** — easier to test & reuse.
3. **Filter by orgId in all queries** — multi-tenant security critical.
4. **Validate input server-side** — don't trust client.
5. **Mark code changes with `// ADDED CLAUDE AI`** for traceability (team convention).
6. **Test on mobile** — most users access via phone.
7. **Beware of SWC parser errors** — stick to standard TS/React syntax, avoid complex type annotations in callbacks.
