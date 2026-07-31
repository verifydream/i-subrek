# iSubrek — Product Requirements Document

> **Status:** Prototype Review → MVP → Production-Ready  
> **Target:** Portfolio-grade self-hosted subscription tracker  
> **Author:** Hermes Agent (review of `verifydream/i-subrek` commit `0864a20`)  
> **Date:** 2026-08-01

---

## 1. Executive Summary

iSubrek is a web application for tracking personal subscriptions, trials, and recurring payments. The current prototype (v0.1.0) has solid foundations — Next.js 15, TypeScript strict, Drizzle ORM, AES-256 encryption, 74 unit tests — but needs significant work to become production-ready and portfolio-grade.

**Goal:** Transform the prototype into a polished, self-hostable MVP that demonstrates senior fullstack engineering skills.

---

## 2. Current State Assessment

### 2.1 What Works Well (Keep)
| Area | Assessment |
|------|-----------|
| Tech stack | Next.js 15 + TypeScript strict + Tailwind v4 — modern, correct |
| Server Actions | Proper `"use server"` pattern, no API routes needed |
| Encryption | AES-256-GCM with random IV & auth tag — correctly implemented |
| Validation | Zod schemas on create + update, `safeParse` everywhere |
| State management | TanStack Query with optimistic updates + rollback |
| Testing | 74 unit tests, vitest + fast-check PBT |
| UI components | shadcn/ui, responsive, dark/light theme |
| PWA | Manifest + service worker scaffold present |

### 2.2 Critical Issues (Must Fix Before MVP)
| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| C1 | Encryption key silently padded when < 32 bytes — catastrophic in production | **Security** | S |
| C2 | `(sub as any).subscriptionType` casts everywhere — schema/type mismatch | **Data integrity** | M |
| C3 | No input sanitization — XSS vector on name, notes, email fields | **Security** | S |
| C4 | No error boundary — any render crash = white screen | **UX** | S |
| C5 | Clerk auth lock-in — cannot self-host without Clerk SaaS dependency | **Self-host** | L |
| C6 | `drizzle.config.ts` only scans `schema.ts`, not `master-schema.ts` — migrations broken | **Infra** | S |
| C7 | No `.env.example` — impossible to onboard | **DX** | XS |

### 2.3 High-Priority Gaps (Should Fix for MVP)
| # | Issue | Impact |
|---|-------|--------|
| H1 | No real reminder/notification system — `reminderDays` is dead data |
| H2 | No data export (CSV/JSON) |
| H3 | No search — only category/status dropdowns |
| H4 | No pagination — all subscriptions loaded at once |
| H5 | No recurring billing auto-advance logic |
| H6 | Settings page (540 lines) — no form validation, no TanStack Query |
| H7 | No loading skeletons — just "Loading..." text |
| H8 | No foreign keys / relations in Drizzle schema |
| H9 | Category system split: hardcoded in list, DB in form — inconsistent |
| H10 | Google Calendar "integration" is just a URL builder, no API |

### 2.4 Medium-Priority Improvements (For Production)
| # | Issue |
|---|-------|
| M1 | No Docker support |
| M2 | No CI/CD |
| M3 | No offline PWA caching |
| M4 | No analytics/charts |
| M5 | No subscription history/audit log |
| M6 | No multi-currency conversion |
| M7 | `maximumScale: 1` — accessibility violation |
| M8 | Mixed English/Indonesian without i18n system |
| M9 | No bulk operations |
| M10 | No rate limiting on server actions |

---

## 3. Target Personas

1. **Individual User** — tracks 5–30 personal subscriptions (Netflix, Spotify, AWS, etc.)
2. **Small Business Owner** — tracks SaaS tools, domain renewals, team licenses
3. **Portfolio Reviewer** — evaluates code quality, architecture decisions, production readiness

---

## 4. MVP Feature Set (What Ships)

### 4.1 Must Have (Phase 1 — Fix Critical)
- [ ] Auth: Replace Clerk with NextAuth.js v5 (self-hostable)
- [ ] Security: Sanitize all user inputs (DOMPurify / escape-html)
- [ ] Security: Hard-fail on invalid ENCRYPTION_KEY (no silent padding)
- [ ] Types: Fix `(sub as any)` casts — proper Drizzle relations
- [ ] Infra: Fix drizzle.config.ts to include master-schema.ts
- [ ] Infra: Add `.env.example`
- [ ] UX: Global error boundary with fallback UI

### 4.2 Should Have (Phase 2 — Core UX)
- [ ] Reminders: Email notification via Resend/Postmark (or cron-based browser notification)
- [ ] Search: Full-text search across subscription names
- [ ] Export: Download all data as CSV/JSON
- [ ] Data: Auto-advance `nextPaymentDate` for recurring subscriptions
- [ ] Data: Drizzle relations (foreign keys between subscriptions ↔ paymentMethods/credentials)
- [ ] UI: Loading skeletons (shadcn/skeleton)
- [ ] UI: Pagination or infinite scroll
- [ ] Settings: Migrate to react-hook-form + zod + TanStack Query
- [ ] Category: Unify — single source of truth from DB

### 4.3 Nice to Have (Phase 3 — Polish)
- [ ] Docker: `Dockerfile` + `docker-compose.yml`
- [ ] CI: GitHub Actions (lint, test, build)
- [ ] PWA: Real offline caching strategy (Workbox)
- [ ] Charts: Monthly spending trend (recharts/chart.js)
- [ ] History: `subscription_history` table for audit log
- [ ] i18n: next-intl with `id` + `en` locales
- [ ] Bulk: Delete/update multiple subscriptions
- [ ] Rate limit: `@upstash/ratelimit` or `express-rate-limit` for server actions
- [ ] E2E: Playwright smoke tests

---

## 5. Non-Goals (Explicitly Out of Scope)

- Mobile native app (PWA is sufficient)
- Team/collaboration features
- Bank API integration
- Cryptocurrency support
- AI-powered recommendations
- White-label / multi-tenant
- Monetization (free, open-source, portfolio project)

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 |
| Test coverage | ≥ 80% (from current ~60%) |
| Bundle size (client) | ≤ 150KB gzipped |
| Self-host setup time | ≤ 5 minutes |
| TypeScript strict errors | 0 |
| ESLint warnings | 0 |

---

## 7. Competitive Landscape

| App | Strength | Weakness |
|-----|----------|----------|
| Bobby | Clean UI, charts | Closed source, no self-host |
| SubsCrab | Open source | Ugly UI, no maintenance |
| Subbi | Recurring detection | No encryption |
| **iSubrek** | Encrypted, modern stack, PWA | Currently prototype |

**Differentiator:** Self-hostable, encrypted passwords, modern stack, PWA offline support.

---

## 8. Architecture Decision Records (ADR)

### ADR-1: Replace Clerk with NextAuth.js v5
- **Rationale:** Self-hostability is the core requirement. Clerk requires SaaS dependency.
- **Trade-off:** Lose pre-built UI components, gain full control.
- **Migration:** Clerk `userId` → NextAuth `user.id` (both strings, DB migration minimal).

### ADR-2: PostgreSQL (Supabase) stays
- **Rationale:** Already working, self-hostable (Supabase local or plain PG). Drizzle ORM is provider-agnostic.
- **Alternative:** SQLite via Turso/LibSQL — simpler self-host but loses PG features.

### ADR-3: Monorepo structure stays flat
- **Rationale:** Single Next.js app, no need for turborepo complexity.
- **Revisit when:** Adding a separate API/worker service.

### ADR-4: Encryption stays AES-256-GCM
- **Rationale:** Correctly implemented. Just need to fix the key validation.
- **Improvement:** Add key derivation (PBKDF2) from master password instead of raw env var.

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Clerk migration breaks auth | Medium | High | Feature flag, dual-auth transition period |
| Encryption key lost | Low | Critical | Document backup procedure, add recovery codes |
| Drizzle migration conflicts | Medium | Medium | Review all relations, run in staging first |
| Bundle size blow-up | Low | Medium | `@next/bundle-analyzer` in CI |

---

## 10. Timeline (Estimated)

| Phase | Content | Est. Effort |
|-------|---------|-------------|
| Phase 1 | Critical fixes (C1–C7) | 3–5 days |
| Phase 2 | Core UX (H1–H9) | 5–8 days |
| Phase 3 | Polish (M1–M10) | 3–5 days |
| **Total** | **Prototype → Production-Ready** | **11–18 days** |

---

## 11. References

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Drizzle ORM Relations](https://orm.drizzle.team/docs/rqb)
- [NextAuth.js v5](https://authjs.dev/getting-started/migrating-to-v5)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
