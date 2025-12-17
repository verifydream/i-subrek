# Product Overview

iSubrek is a subscription tracking web application that helps users manage recurring payments, monitor billing cycles, and securely store account credentials. The app prevents accidental charges by providing reminders and a clear overview of all subscriptions.

## Key Features
- Track subscriptions with billing cycles (monthly, yearly, one-time, trial)
- Dashboard with spending summaries and upcoming payment alerts
- Secure payment method storage (masked, last 4 digits only)
- Optional AES-encrypted password storage for subscription accounts
- Google Calendar integration for payment reminders
- Category-based organization (Entertainment, Tools, Work, Utilities)
- Mobile-first responsive design with Sheet/Drawer forms

## Security Principles
- Payment methods are masked server-side, never storing full numbers
- Passwords encrypted with AES using server-side environment key
- All sensitive operations happen via Server Actions
- User data isolation enforced by Clerk user ID filtering
