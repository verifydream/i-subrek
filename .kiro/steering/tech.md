# Tech Stack

## Core Framework
- Next.js 15 (App Router with React Server Components)
- React 19
- TypeScript 5 (strict mode enabled)

## Styling
- Tailwind CSS v4 with PostCSS
- shadcn/ui (new-york style, slate base color, CSS variables)
- tw-animate-css for animations
- Lucide React for icons
- `cn()` utility from `@/lib/utils` for class merging

## Database & Backend
- Supabase (PostgreSQL) via postgres-js driver
- Drizzle ORM with drizzle-kit for migrations
- Server Actions for all data operations

## Authentication
- Clerk (@clerk/nextjs) with Google OAuth and email support

## Forms & Validation
- React Hook Form for form state
- Zod v4 for schema validation
- @hookform/resolvers for integration

## State Management
- Zustand for UI state (theme, modals)
- TanStack Query for server state (subscriptions data, caching)

## Security
- AES encryption for passwords (server-side only)
- Payment method masking (last 4 digits only)
- Environment key: `ENCRYPTION_KEY`

## Utilities
- date-fns for date manipulation
- clsx + tailwind-merge for className handling

## Testing
- Vitest as test runner
- fast-check for property-based testing

## Common Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run Vitest tests
```

## Environment Variables
```
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=              # Supabase PostgreSQL connection string
ENCRYPTION_KEY=            # AES encryption key for passwords
```

## Path Alias
- `@/*` maps to `./src/*`
