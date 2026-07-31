## Phase 1 Decisions

- 1.1: Replaced `if (keyBuffer.length < 32)` with exact 32-byte check, failing hard if not valid.
- 1.2: Added `master-schema.ts` to `drizzle.config.ts`.
- 1.3: Copied `.env.example` directly from specs.
- 1.4: Used a React class component for the global `ErrorBoundary` and wrapped `{children}` in `src/app/layout.tsx`.
- 1.5: Removed `(sub as any).subscriptionType` and used properly typed columns in hooks and lib.
- 1.6: Wrote a simple `sanitizeInput` regex string replacer in `src/lib/utils.ts` instead of using a heavy DOMPurify library, and applied it to text fields in actions.
- 1.7: Fixed missing fields in `subscriptionArb` testing utility instead of silencing, fixed lint errors (replaced `any` with `unknown` / `Error`).
