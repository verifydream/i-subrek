# Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout with ClerkProvider
│   ├── page.tsx                # Dashboard (main page)
│   ├── globals.css             # Global styles and CSS variables
│   └── subscriptions/
│       └── [id]/page.tsx       # Subscription detail view
├── actions/                    # Server Actions
│   └── subscriptions.ts        # CRUD operations for subscriptions
├── components/                 # React components
│   ├── ui/                     # shadcn/ui components
│   ├── subscription-form.tsx   # Create/edit form with React Hook Form
│   ├── subscription-sheet.tsx  # Mobile Sheet/Drawer wrapper
│   ├── subscription-card.tsx   # Individual subscription display
│   ├── subscription-list.tsx   # Grid/list with filtering
│   ├── summary-cards.tsx       # Dashboard summary stats
│   ├── password-copy-button.tsx
│   ├── calendar-button.tsx
│   └── theme-toggle.tsx
├── db/                         # Database layer
│   ├── index.ts                # postgres-js client config
│   └── schema.ts               # Drizzle schema with enums
├── lib/                        # Utility functions
│   ├── utils.ts                # cn() helper
│   ├── masking.ts              # Payment method masking
│   ├── encryption.ts           # AES password encryption
│   ├── date-utils.ts           # Payment date calculations
│   ├── calculations.ts         # Dashboard calculations
│   ├── filtering.ts            # Category/status filtering
│   ├── serialization.ts        # JSON serialization
│   ├── calendar.ts             # Google Calendar URL generation
│   └── validations.ts          # Zod schemas
├── hooks/                      # Custom React hooks
│   ├── use-auth.ts             # Clerk user ID access
│   └── use-subscriptions.ts    # TanStack Query hook
└── stores/                     # Zustand stores
    └── ui-store.ts             # Theme state
```

## Conventions
- Server Components by default; add `"use client"` only when needed
- All CRUD operations via Server Actions in `src/actions/`
- Import paths use `@/` alias (e.g., `@/components/ui/button`)
- Tests colocated in `__tests__/` folders using Vitest + fast-check
- Sensitive operations (encryption, masking) only in server-side code

## Fonts
- Geist Sans (--font-geist-sans) - primary font
- Geist Mono (--font-geist-mono) - monospace font
