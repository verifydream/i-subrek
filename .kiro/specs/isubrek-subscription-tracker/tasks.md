# Implementation Plan

- [x] 1. Set up project infrastructure and database






  - [x] 1.1 Configure Drizzle ORM with Supabase connection

    - Create `src/db/index.ts` with postgres-js client configuration
    - Create `src/db/schema.ts` with subscriptions table and enums
    - Create `drizzle.config.ts` for migrations
    - _Requirements: 2.1_

  - [x] 1.2 Generate and apply database migration

    - Run Drizzle migration to create subscriptions table in Supabase
    - Verify table structure matches schema definition
    - _Requirements: 2.1_

  - [x] 1.3 Set up Vitest and fast-check testing framework

    - Install vitest, @vitest/ui, fast-check dependencies
    - Create `vitest.config.ts` with TypeScript support
    - Create test setup file for common utilities
    - _Requirements: 2.6_

- [x] 2. Implement core utility functions





  - [x] 2.1 Create payment method masking utilities


    - Implement `maskPaymentMethod(fullNumber: string): string` in `src/lib/masking.ts`
    - Implement `extractLastFourDigits(fullNumber: string): string`
    - Handle edge cases: short numbers, non-numeric characters
    - _Requirements: 3.1, 3.3_

  - [x] 2.2 Write property test for payment masking

    - **Property 7: Payment Method Masking**
    - **Validates: Requirements 3.1, 3.3**
  - [x] 2.3 Create password encryption utilities


    - Implement `encryptPassword(plainText: string): string` in `src/lib/encryption.ts`
    - Implement `decryptPassword(cipherText: string): string`
    - Use AES encryption with server-side ENCRYPTION_KEY env variable
    - _Requirements: 4.1, 4.2_

  - [x] 2.4 Write property test for password encryption round-trip

    - **Property 8: Password Encryption Round-Trip**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 2.5 Create date calculation utilities

    - Implement `calculateNextPaymentDate(startDate: Date, billingCycle: BillingCycle): Date` in `src/lib/date-utils.ts`
    - Implement `isWithinReminderDays(nextPaymentDate: Date, reminderDays: number): boolean`
    - Implement `advancePaymentDate(currentNextDate: Date, billingCycle: BillingCycle): Date`
    - Use date-fns for date manipulation
    - _Requirements: 2.2, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 2.6 Write property tests for date calculations

    - **Property 3: Next Payment Date Calculation**
    - **Property 12: Reminder Days Highlighting**
    - **Property 15: Payment Date Advancement**
    - **Validates: Requirements 2.2, 5.6, 10.1-10.5**

  - [x] 2.7 Create subscription serialization utilities

    - Implement `serializeSubscription(subscription: Subscription): string` in `src/lib/serialization.ts`
    - Implement `deserializeSubscription(json: string): Subscription`
    - Handle date serialization/deserialization correctly
    - _Requirements: 2.7, 2.8_

  - [x] 2.8 Write property test for serialization round-trip

    - **Property 6: Subscription Serialization Round-Trip**
    - **Validates: Requirements 2.7, 2.8**

- [x] 3. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Zod validation schemas






  - [x] 4.1 Create validation schemas

    - Implement `createSubscriptionSchema` in `src/lib/validations.ts`
    - Implement `updateSubscriptionSchema`
    - Include all field validations as per design document
    - _Requirements: 2.6_

  - [x] 4.2 Write property test for Zod validation

    - **Property 5: Zod Validation Correctness**
    - **Validates: Requirements 2.6**

- [x] 5. Implement server actions for CRUD operations






  - [x] 5.1 Create subscription server actions

    - Implement `createSubscription` action in `src/actions/subscriptions.ts`
    - Implement `updateSubscription` action
    - Implement `deleteSubscription` action
    - Implement `getSubscriptions` action with user filtering
    - Implement `getSubscriptionById` action
    - Integrate masking and encryption before database operations
    - _Requirements: 2.1, 2.4, 3.1, 4.1_

  - [x] 5.2 Write property tests for server actions

    - **Property 1: User Data Isolation**
    - **Property 2: Subscription Creation Integrity**
    - **Property 4: Subscription Deletion Completeness**
    - **Validates: Requirements 1.5, 2.1, 2.4, 2.5**
  - [x] 5.3 Create password decryption server action

    - Implement `decryptSubscriptionPassword` action
    - Verify user ownership before decryption
    - _Requirements: 4.2, 4.5_

- [x] 6. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement dashboard calculation utilities






  - [x] 7.1 Create dashboard calculation functions

    - Implement `calculateTotalMonthlySpending(subscriptions: Subscription[]): number` in `src/lib/calculations.ts`
    - Implement `countActiveSubscriptions(subscriptions: Subscription[]): number`
    - Implement `getTrialsEndingSoon(subscriptions: Subscription[], thresholdDays: number): Subscription[]`
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 7.2 Write property tests for dashboard calculations


    - **Property 9: Total Monthly Spending Calculation**
    - **Property 10: Active Subscription Count**
    - **Property 11: Trials Ending Soon Filter**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 7.3 Create filtering utilities

    - Implement `filterByCategory(subscriptions: Subscription[], category: Category): Subscription[]` in `src/lib/filtering.ts`
    - Implement `filterByStatus(subscriptions: Subscription[], status: Status): Subscription[]`
    - _Requirements: 9.2, 9.3_
  - [x] 7.4 Write property test for filtering


    - **Property 14: Category and Status Filtering**
    - **Validates: Requirements 9.2, 9.3**

- [x] 8. Implement Google Calendar integration






  - [x] 8.1 Create calendar URL generator

    - Implement `generateGoogleCalendarUrl(subscription: Subscription): string` in `src/lib/calendar.ts`
    - Include event title "Renew [name]", date, and description
    - Properly encode URL parameters
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 8.2 Write property test for calendar URL generation

    - **Property 13: Google Calendar URL Generation**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 9. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Set up Clerk authentication






  - [x] 10.1 Configure Clerk provider and middleware

    - Install @clerk/nextjs
    - Create `src/middleware.ts` with Clerk auth middleware
    - Wrap app with ClerkProvider in layout
    - Configure public/protected routes
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 10.2 Create auth utility hooks

    - Create `src/hooks/use-auth.ts` for accessing user ID
    - Integrate with server actions for user filtering
    - _Requirements: 1.5_

- [x] 11. Install and configure Shadcn/UI components






  - [x] 11.1 Install required Shadcn components

    - Install: Button, Card, Input, Form, Dialog, Sheet, Select, Table, DatePicker, Toast (sonner)
    - Configure dark/light theme support
    - _Requirements: 5.4, 5.5, 6.1, 8.1_

  - [x] 11.2 Set up Zustand store for UI state

    - Create `src/stores/ui-store.ts` with theme state
    - Implement theme toggle functionality
    - Persist theme preference to localStorage
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 12. Build subscription form component






  - [x] 12.1 Create subscription form

    - Build `src/components/subscription-form.tsx` with React Hook Form
    - Integrate Zod validation schema
    - Implement conditional password field (hide for Google/GitHub login)
    - Add next payment date preview based on cycle selection
    - _Requirements: 6.2, 6.3, 4.3_

  - [x] 12.2 Create form wrapper with Sheet/Drawer

    - Build `src/components/subscription-sheet.tsx` for mobile-friendly form
    - Integrate toast notifications for success/error
    - _Requirements: 6.1, 6.4, 6.5_

- [x] 13. Build dashboard UI components






  - [x] 13.1 Create summary cards component

    - Build `src/components/summary-cards.tsx`
    - Display total monthly spending, active count, trials ending soon
    - Apply warning styling for trials
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 13.2 Create subscription card component

    - Build `src/components/subscription-card.tsx`
    - Display name, price, next payment date, category
    - Highlight items within reminder days
    - Include edit/delete actions
    - _Requirements: 5.6_

  - [x] 13.3 Create subscription list component

    - Build `src/components/subscription-list.tsx`
    - Implement responsive grid (desktop) / list (mobile) layout
    - Integrate filtering by category and status
    - _Requirements: 5.4, 5.5, 9.2, 9.3_

- [x] 14. Build subscription detail view

  - [x] 14.1 Create detail page
    - Build `src/app/subscriptions/[id]/page.tsx`
    - Display all subscription information
    - Show masked payment method
    - _Requirements: 3.2_

  - [x] 14.2 Create password copy button component
    - Build `src/components/password-copy-button.tsx`
    - Implement server action call for decryption
    - Copy to clipboard without displaying password
    - _Requirements: 4.4, 4.5_

  - [x] 14.3 Create calendar button component

    - Build `src/components/calendar-button.tsx`
    - Generate and open Google Calendar URL
    - _Requirements: 7.4_

- [x] 15. Build main dashboard page






  - [x] 15.1 Create dashboard page

    - Build `src/app/page.tsx` as server component
    - Fetch subscriptions via server action
    - Compose summary cards and subscription list
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 15.2 Set up TanStack Query for client-side data

    - Configure QueryClientProvider
    - Create `src/hooks/use-subscriptions.ts` query hook
    - Implement optimistic updates for CRUD operations
    - _Requirements: 2.1, 2.3, 2.4_

- [ ] 16. Implement theme toggle
  - [ ] 16.1 Create theme toggle component
    - Build `src/components/theme-toggle.tsx`
    - Integrate with Zustand store
    - Add to app header/navigation
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 17. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
