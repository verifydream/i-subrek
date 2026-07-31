# iSubrek — Task Checklist

> Track completion status per task. ✅ = done, 🔴 = not started, 🟡 = in progress, ⚠️ = blocked

---

## Phase 1: Critical Fixes (Foundation)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Fix encryption key validation | 🔴 | |
| 1.2 | Fix drizzle.config.ts schema array | 🔴 | |
| 1.3 | Add `.env.example` | 🔴 | |
| 1.4 | Add global error boundary | 🔴 | |
| 1.5 | Remove `(sub as any)` type casts | 🔴 | |
| 1.6 | Sanitize user input (XSS) | 🔴 | |
| 1.7 | Fix TypeScript strict violations | 🔴 | |

**Phase 1 Gate:** `npm run build` clean, `npm run test` all pass, `npm run lint` zero errors.

---

## Phase 2: Auth Migration (Clerk → NextAuth.js v5)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Install & configure NextAuth.js v5 | 🔴 | |
| 2.2 | Update server actions for NextAuth | 🔴 | |
| 2.3 | Remove Clerk dependencies | 🔴 | |

**Phase 2 Gate:** Login via Google + credentials works. Existing user data preserved.

---

## Phase 3: Core UX Improvements

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Add loading skeletons | 🔴 | |
| 3.2 | Add full-text search | 🔴 | |
| 3.3 | Add data export (CSV/JSON) | 🔴 | |
| 3.4 | Auto-advance recurring payment dates | 🔴 | |
| 3.5 | Rebuild settings page (rhf + zod + TQ) | 🔴 | |
| 3.6 | Add drizzle relations (foreign keys) | 🔴 | |
| 3.7 | Unify category system | 🔴 | |

**Phase 3 Gate:** All user-facing improvements functional. No regressions in CRUD.

---

## Phase 4: Production Polish

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Dockerize (Dockerfile + compose) | 🔴 | |
| 4.2 | GitHub Actions CI | 🔴 | |
| 4.3 | Monthly spending trend chart | 🔴 | |
| 4.4 | Subscription history / audit log | 🔴 | |
| 4.5 | Playwright E2E smoke tests | 🔴 | |
| 4.6 | Rate limiting for server actions | 🔴 | |

**Phase 4 Gate:** `docker compose up` → app running on `localhost:3000`. CI green. E2E passing.

---

## Final Verification Checklist

- [ ] `npm run build` — zero errors
- [ ] `npm run lint` — zero warnings
- [ ] `npm run test` — all passing, ≥ 80% coverage
- [ ] `npx tsc --noEmit` — zero errors
- [ ] Lighthouse ≥ 90 performance, ≥ 95 accessibility
- [ ] `docker compose up` — app accessible at `http://localhost:3000`
- [ ] Login → Create → Edit → Delete → Export → full flow works
- [ ] PWA installable on Android + iOS
- [ ] `.env.example` matches all required env vars

---

## Known Technical Debt (Post-MVP)

| Item | Priority | Effort |
|------|----------|--------|
| PBKDF2 key derivation instead of raw ENCRYPTION_KEY | Medium | S |
| Multi-currency conversion rates | Low | M |
| `maximumScale: 1` removal (a11y) | Low | XS |
| i18n system (next-intl) | Low | M |
| Real Google Calendar API integration | Low | L |
| E2E test suite expansion | Low | M |
| Monitoring/alerting (Sentry) | Low | S |
