# Requirements Document

## Introduction

iSubrek is a responsive web application designed to help users track their subscriptions, trials, and recurring payments. The system prevents accidental charges by monitoring billing cycles, payment methods, and securely storing account credentials. Built with Next.js 15, TypeScript, Supabase, and Clerk authentication, the application provides a modern, mobile-first experience for subscription management.

## Glossary

- **Subscription**: A recurring payment arrangement for a service (e.g., Netflix, Spotify, AWS)
- **Billing Cycle**: The frequency of payment (monthly, yearly, one-time, or trial)
- **Payment Method**: The financial instrument used for payment (e.g., GoPay, BCA, Jenius)
- **Reminder Days**: Number of days before payment date to notify the user
- **Masked Number**: A partially hidden payment method number showing only last 4 digits (e.g., "**** 1234")
- **Next Payment Date**: The calculated upcoming payment date based on start date and billing cycle
- **Trial**: A temporary subscription period, often free, before regular billing begins
- **Dashboard**: The main interface displaying subscription summaries and lists
- **Server Action**: A Next.js server-side function for secure data operations

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to securely sign in to the application using my Google account or email, so that my subscription data is protected and personalized.

#### Acceptance Criteria

1. WHEN a user visits the application without authentication THEN the System SHALL redirect the user to the Clerk sign-in page
2. WHEN a user authenticates via Google OAuth THEN the System SHALL create a session and associate the Clerk user ID with subscription data
3. WHEN a user authenticates via email THEN the System SHALL verify the email and create a session
4. WHEN a user signs out THEN the System SHALL terminate the session and redirect to the sign-in page
5. WHEN an authenticated user accesses the application THEN the System SHALL display only subscriptions belonging to that user's Clerk ID

### Requirement 2: Subscription Data Management

**User Story:** As a user, I want to create, read, update, and delete my subscriptions, so that I can maintain an accurate record of my recurring payments.

#### Acceptance Criteria

1. WHEN a user submits a new subscription form with valid data THEN the System SHALL create a subscription record with a unique UUID and the user's Clerk ID
2. WHEN a user provides a start date and billing cycle THEN the System SHALL automatically calculate and store the next payment date
3. WHEN a user updates a subscription's billing cycle or start date THEN the System SHALL recalculate the next payment date
4. WHEN a user deletes a subscription THEN the System SHALL remove the record from the database
5. WHEN a user views their subscriptions THEN the System SHALL retrieve only records matching the authenticated user's Clerk ID
6. WHEN a subscription is created or updated THEN the System SHALL validate all required fields using Zod schema validation
7. WHEN a user serializes subscription data for storage THEN the System SHALL encode the data to JSON format
8. WHEN a user deserializes subscription data from storage THEN the System SHALL decode the JSON and reconstruct the subscription object

### Requirement 3: Payment Method Security

**User Story:** As a user, I want my payment method details to be securely masked, so that sensitive financial information is protected.

#### Acceptance Criteria

1. WHEN a user enters a full credit card or payment method number THEN the System SHALL extract and store only the last 4 digits in masked format
2. WHEN a user views payment method details THEN the System SHALL display the masked format (e.g., "**** 1234")
3. WHEN a subscription is saved THEN the System SHALL never store the full payment method number in the database

### Requirement 4: Password Encryption

**User Story:** As a user, I want to optionally store my subscription account passwords securely, so that I can access them when needed without compromising security.

#### Acceptance Criteria

1. WHEN a user enters an account password THEN the System SHALL encrypt the password using AES encryption with a server-side environment key before storage
2. WHEN a user requests to view or copy a stored password THEN the System SHALL decrypt the password via a server action
3. WHEN a user selects Google or GitHub as the login method for a subscription THEN the System SHALL hide the password field
4. WHEN displaying subscription details THEN the System SHALL never display decrypted passwords directly on screen without user action
5. WHEN a user clicks the "Copy Password" button THEN the System SHALL decrypt the password server-side and copy it to the clipboard

### Requirement 5: Dashboard Display

**User Story:** As a user, I want to see a dashboard with summary cards and my subscription list, so that I can quickly understand my subscription status and spending.

#### Acceptance Criteria

1. WHEN a user views the dashboard THEN the System SHALL display a summary card showing total monthly spending calculated from active subscriptions
2. WHEN a user views the dashboard THEN the System SHALL display a summary card showing the count of active subscriptions
3. WHEN a user views the dashboard THEN the System SHALL display a summary card highlighting trials ending soon with warning styling
4. WHEN a user views the dashboard on desktop THEN the System SHALL display subscriptions in a responsive grid layout
5. WHEN a user views the dashboard on mobile THEN the System SHALL display subscriptions in a card-based list layout
6. WHEN a subscription's next payment date is within the configured reminder days THEN the System SHALL highlight that subscription with visual emphasis

### Requirement 6: Subscription Form Interface

**User Story:** As a user, I want to add and edit subscriptions through a mobile-friendly form, so that I can manage my subscriptions efficiently on any device.

#### Acceptance Criteria

1. WHEN a user initiates adding a new subscription on mobile THEN the System SHALL display the form in a Sheet/Drawer component
2. WHEN a user submits the form with invalid data THEN the System SHALL display validation errors using React Hook Form and Zod
3. WHEN a user selects a billing cycle and start date THEN the System SHALL preview the calculated next payment date
4. WHEN a form operation succeeds THEN the System SHALL display a toast notification confirming the action
5. WHEN a form operation fails THEN the System SHALL display a toast notification with the error message

### Requirement 7: Calendar Integration

**User Story:** As a user, I want to add subscription renewal reminders to my Google Calendar, so that I receive external notifications about upcoming payments.

#### Acceptance Criteria

1. WHEN a user clicks "Add to Calendar" for a subscription THEN the System SHALL generate a Google Calendar URL with the event name "Renew [Subscription Name]"
2. WHEN generating the calendar link THEN the System SHALL include the next payment date as the event date
3. WHEN generating the calendar link THEN the System SHALL include subscription details in the event description
4. WHEN the calendar link is clicked THEN the System SHALL open Google Calendar in a new tab with prepopulated event data

### Requirement 8: Theme Support

**User Story:** As a user, I want to switch between dark and light themes, so that I can use the application comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN a user toggles the theme THEN the System SHALL switch between dark and light mode
2. WHEN the application loads THEN the System SHALL respect the user's system theme preference
3. WHEN the theme changes THEN the System SHALL persist the preference for future sessions

### Requirement 9: Data Filtering and Categories

**User Story:** As a user, I want to filter and categorize my subscriptions, so that I can organize and find specific subscriptions easily.

#### Acceptance Criteria

1. WHEN a user assigns a category to a subscription THEN the System SHALL store the category (Entertainment, Tools, Work, or Utilities)
2. WHEN a user filters by category THEN the System SHALL display only subscriptions matching the selected category
3. WHEN a user filters by status THEN the System SHALL display only subscriptions matching the selected status (active, cancelled, or expired)

### Requirement 10: Next Payment Date Calculation

**User Story:** As a user, I want the system to automatically calculate payment dates, so that I always know when my next payment is due.

#### Acceptance Criteria

1. WHEN a subscription has a monthly billing cycle THEN the System SHALL calculate the next payment date as one month from the start date or previous payment
2. WHEN a subscription has a yearly billing cycle THEN the System SHALL calculate the next payment date as one year from the start date or previous payment
3. WHEN a subscription has a one-time billing cycle THEN the System SHALL set the next payment date equal to the start date
4. WHEN a subscription is a trial THEN the System SHALL set the next payment date as the trial end date
5. WHEN the current date passes the next payment date THEN the System SHALL recalculate to the subsequent payment date based on the billing cycle
