# iSubrek — Implementation Plan

> **For AI coding agents:** Execute tasks phase-by-phase, in order. Each phase gates the next.  
> **For subagent-driven workflow:** One task = one `delegate_task` call. Review output before next task.  
> **Commit strategy:** One commit per task. Conventional commits (`feat:`, `fix:`, `refactor:`, `chore:`).

---

## Phase 1: Critical Fixes (Foundation)

> **Outcome:** Production-safe foundation. No silent failures, no type holes, no XSS vectors.

---

### Task 1.1: Fix encryption key validation

**Files:** `src/lib/encryption.ts`

**Problem:** `getEncryptionKey()` silently pads short keys with zero bytes. If `ENCRYPTION_KEY=abc`, padding creates `abc\0\0\0...\0` — decryptable now, garbage after key rotation.

**Fix:** Throw on invalid key length. Require exactly 32 bytes.

```typescript
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  const keyBuffer = Buffer.from(key, "utf-8");
  if (keyBuffer.byteLength !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 32 bytes (got ${keyBuffer.byteLength} bytes). ` +
      `Generate one with: openssl rand -base64 32 | tr -d '\n'`
    );
  }
  return keyBuffer;
}
```

**Verification:** `npm run test -- src/lib/__tests__/encryption.test.ts` — all pass. Also test manually: set `ENCRYPTION_KEY=shortkey` → `npm run dev` → should throw immediately.

**Commit:** `fix: hard-fail on invalid ENCRYPTION_KEY length (was silent pad)`

---

### Task 1.2: Fix drizzle.config.ts — include master schema

**Files:** `drizzle.config.ts`

**Problem:** Only `./src/db/schema.ts` is listed. `master-schema.ts` tables never get migrated.

**Fix:**

```typescript
export default defineConfig({
  schema: [
    "./src/db/schema.ts",
    "./src/db/master-schema.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

**Verification:** `npm run db:generate` — should pick up all tables from both schema files.

**Commit:** `fix: include master-schema.ts in drizzle config`

---

### Task 1.3: Add `.env.example`

**Files:** `.env.example` (new)

**Content:**

```env
# Clerk Authentication (Phase 1 — will be replaced by NextAuth in Phase 2)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/isubrek

# Encryption Key — generate with: openssl rand -base64 32 | tr -d '\n'
# MUST be exactly 32 characters (256 bits)
ENCRYPTION_KEY=change-me-to-a-real-32-byte-key!!
```

**Commit:** `chore: add .env.example`

---

### Task 1.4: Add global error boundary

**Files:**
- Create: `src/components/error-boundary.tsx`
- Modify: `src/app/layout.tsx`

**Component:**

```tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Layout change:** Wrap `{children}` inside `<Providers>` with `<ErrorBoundary>`.

**Verification:** Temporarily throw in a component → should show fallback UI, not white screen.

**Commit:** `feat: add global error boundary`

---

### Task 1.5: Fix `(sub as any)` type casts — add subscriptionType to Drizzle return type

**Files:**
- `src/db/schema.ts`
- `src/hooks/use-subscriptions.ts`
- `src/components/subscription-form.tsx`
- `src/lib/calculations.ts`
- `src/lib/filtering.ts`

**Problem:** `subscriptionType` column exists in DB + schema, but code uses `(sub as any).subscriptionType` because `countActiveSubscriptions` etc. receive `Subscription[]`.

**Root cause:** `subscriptionType` is already in the Schema but TypeScript sees it correctly — the `as any` casts are unnecessary. They exist because early versions of the code predate the column.

**Fix:** Remove ALL `(sub as any).subscriptionType` casts and use `sub.subscriptionType` directly. The column is already in `Subscription` type.

**Verification:** `npm run build` — zero type errors. `npm run test` — all pass.

**Commit:** `refactor: remove (sub as any).subscriptionType casts, use typed column`

---

### Task 1.6: Sanitize user input in server actions

**Files:**
- `src/actions/subscriptions.ts`
- `src/actions/master-data.ts`

**Problem:** User-provided strings (`name`, `accountEmail`, `notes`, `url`, `category`) are stored directly without sanitization. Open XSS vector.

**Fix:** No new dependency — use a minimal sanitize function:

```typescript
// Add to src/lib/utils.ts
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
```

Apply `sanitizeInput()` to all free-text string fields in `createSubscription` and `createPaymentMethod` / `createAccountCredential`. Strip HTML tags from `notes` via `.replace(/<[^>]*>/g, "")`.

**Skip (YAGNI):** DOMPurify as dependency — 5 lines of escape covers the threat model.

**Verification:** Create subscription with `<script>alert('xss')</script>` in name → rendered as text, not executed.

**Commit:** `fix: sanitize user input to prevent stored XSS`

---

### Task 1.7: Audit and fix TypeScript strict violations

**Files:** `tsconfig.json`, all `*.ts`/`*.tsx`

**Check:** Run `npx tsc --noEmit` and fix all errors.

**Known issues to fix:**
- Settings page `any` casts on form handlers
- Missing return types on some server actions
- `zod@4` resolver types may be misaligned with `@hookform/resolvers`

**Commit:** `fix: resolve TypeScript strict violations`

---

## Phase 2: Auth Migration (Clerk → NextAuth.js v5)

> **Outcome:** Self-hostable authentication. No third-party SaaS dependency.

---

### Task 2.1: Install and configure NextAuth.js v5

**Files:** `package.json`, `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/db/schema.ts`

**Changes:**
1. Add `next-auth@beta` + `@auth/drizzle-adapter`
2. Replace `src/lib/auth.ts` Clerk wrapper with NextAuth config
3. Replace `src/middleware.ts` Clerk middleware with NextAuth middleware
4. Add `accounts`, `sessions`, `verificationTokens` tables to Drizzle schema
5. Add `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` to `.env.example`
6. Update `src/app/sign-in` and `src/app/sign-up` pages

**Verification:**
- Google OAuth login works
- Email/password (credentials provider) works
- `useSession()` returns correct user ID
- Existing subscriptions still bound to user

**Commit:** `feat: migrate from Clerk to NextAuth.js v5 for self-hostable auth`

---

### Task 2.2: Update server actions to use NextAuth user ID

**Files:** All `src/actions/*.ts`, `src/hooks/use-auth.ts`

**Changes:**
- Replace `auth()` from `src/lib/auth.ts` (new NextAuth helper)
- Remove all Clerk-specific imports
- Update `subscriptionKeys.list(userId)` → same pattern, new ID source

**Verification:** CRUD operations work after login.

**Commit:** `refactor: adapt server actions for NextAuth user ID`

---

### Task 2.3: Remove Clerk dependencies

**Files:** `package.json`, all files referencing `@clerk/*`

**Changes:**
- `npm uninstall @clerk/nextjs`
- Remove ClerkProvider from layout
- Remove Clerk env vars from `.env.example`
- Update middleware to use NextAuth

**Commit:** `chore: remove Clerk dependencies`

---

## Phase 3: Core UX Improvements

> **Outcome:** Polished user experience. Skeletons, search, export, auto-advance billing.

---

### Task 3.1: Add loading skeletons

**Files:**
- `src/components/summary-cards.tsx` — skeleton variant
- `src/components/subscription-list.tsx` — skeleton variant
- `src/app/page.tsx` — use skeletons during loading

**Implementation:** Use existing `@/components/ui/skeleton` (shadcn). Create `SubscriptionCardSkeleton` and `SummaryCardSkeleton`.

**Commit:** `feat: add loading skeletons for dashboard and list`

---

### Task 3.2: Add full-text search

**Files:**
- `src/components/subscription-list.tsx`
- `src/actions/subscriptions.ts` (optional server-side search)

**Implementation:**
1. Add `<Input type="search">` above the grid
2. Client-side filter: `subscriptions.filter(s => s.name.toLowerCase().includes(query))`
3. Debounce 300ms

**Commit:** `feat: add search bar for subscription names`

---

### Task 3.3: Add data export (CSV/JSON)

**Files:**
- `src/components/export-button.tsx` (new)
- `src/lib/export.ts` (new)

**Implementation:**
1. Button in header: "Export" dropdown (CSV / JSON)
2. `exportToCSV(subscriptions)` — generates CSV download
3. `exportToJSON(subscriptions)` — generates JSON download
4. Exclude `accountPasswordEncrypted` from export

**Commit:** `feat: add CSV/JSON export for subscriptions`

---

### Task 3.4: Auto-advance nextPaymentDate for recurring subscriptions

**Files:**
- `src/lib/date-utils.ts`
- `src/actions/subscriptions.ts`
- `src/app/page.tsx` (or a new useEffect/module)

**Implementation:**
1. On dashboard load, check all active subscriptions
2. If `nextPaymentDate` < today AND `status === "active"` AND `billingCycle !== "one-time"`:
   - Advance `nextPaymentDate` by one cycle
3. Show toast: "Payment date advanced for [name]"

**Commit:** `feat: auto-advance past-due recurring payment dates`

---

### Task 3.5: Rebuild settings page with proper form handling

**Files:**
- `src/app/settings/settings-client.tsx`

**Rewrite:**
1. Use react-hook-form + zod for all 3 sections
2. Use TanStack Query for data fetching (not `useState` with initial props)
3. Add delete confirmation dialog
4. Add edit mode within dialog (not separate state)

**Commit:** `refactor: rebuild settings page with rhf + zod + TanStack Query`

---

### Task 3.6: Drizzle relations — foreign keys

**Files:** `src/db/schema.ts`, `src/db/master-schema.ts`

**Changes:**
1. Add `subscriptions.paymentMethodId` → `paymentMethods.id` FK (nullable)
2. Add `subscriptions.credentialId` → `accountCredentials.id` FK (nullable)
3. Add `subscriptions.categoryId` → `customCategories.id` FK (nullable)
4. Generate & push migration

**Commit:** `feat: add drizzle relations with foreign keys`

---

### Task 3.7: Unify category system

**Files:**
- `src/components/subscription-list.tsx`
- `src/actions/master-data.ts`

**Changes:**
1. Remove hardcoded `categoryOptions` in SubscriptionList
2. Fetch categories from DB via `getCategoriesWithSeed`
3. Pass as prop or use TanStack Query in the component

**Commit:** `refactor: unify category source to DB only`

---

## Phase 4: Production Polish

> **Outcome:** Portfolio-ready. Docker, CI, charts, i18n, E2E tests.

---

### Task 4.1: Dockerize

**Files:**
- `Dockerfile` (new)
- `docker-compose.yml` (new)
- `.dockerignore` (new)

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**docker-compose.yml:** App + PostgreSQL service.

**Commit:** `feat: add Dockerfile and docker-compose`

---

### Task 4.2: GitHub Actions CI

**Files:** `.github/workflows/ci.yml` (new)

**Jobs:**
1. `lint` — `npm run lint`
2. `test` — `npm run test`
3. `build` — `npm run build`
4. `typecheck` — `npx tsc --noEmit`

**Commit:** `ci: add GitHub Actions workflow`

---

### Task 4.3: Add monthly spending trend chart

**Files:**
- `src/components/spending-chart.tsx` (new)
- `src/lib/chart-data.ts` (new)

**Stack:** `recharts` (minimal, React-native)

**Chart:** Last 6 months bar chart showing total spending per month.

**Commit:** `feat: add monthly spending trend chart`

---

### Task 4.4: Add subscription history / audit log

**Files:**
- `src/db/schema.ts` — new `subscription_history` table
- `src/actions/subscriptions.ts` — log on create/update/delete
- `src/components/subscription-history.tsx` (new)

**Schema:**
```typescript
export const subscriptionHistory = pgTable("subscription_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(), // "created", "updated", "deleted"
  changes: jsonb("changes"), // diff of changed fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Commit:** `feat: add subscription audit log`

---

### Task 4.5: E2E smoke tests with Playwright

**Files:**
- `e2e/smoke.spec.ts` (new)
- `playwright.config.ts` (new)

**Scenarios:**
1. Login → dashboard loads
2. Create subscription → appears in list
3. Edit subscription → name updates
4. Delete subscription → removed from list
5. Export CSV → file downloads

**Commit:** `test: add Playwright E2E smoke tests`

---

### Task 4.6: Rate limiting for server actions

**Files:**
- `src/middleware.ts`
- `package.json` — add `@upstash/ratelimit` + `@upstash/redis`

**Implementation:**
1. Rate limit all `/api/*` and server action calls: 10 req/sec per IP
2. Return 429 with friendly message

**Commit:** `feat: add rate limiting for server actions`

---

## Task Checklist

See [task-check.md](./task-check.md) for the detailed checklist.
