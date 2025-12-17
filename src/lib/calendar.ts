/**
 * Google Calendar URL generation utilities
 * Creates calendar event URLs for subscription renewal reminders
 *
 * Requirements: 7.1, 7.2, 7.3
 */

import type { Subscription } from "@/db/schema";

/**
 * Formats a Date object to Google Calendar date format (YYYYMMDD)
 *
 * @param date - The date to format
 * @returns Date string in YYYYMMDD format
 */
function formatDateForCalendar(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Generates a description for the calendar event
 *
 * @param subscription - The subscription to generate description for
 * @returns Event description string
 */
function generateEventDescription(subscription: Subscription): string {
  const parts: string[] = [];

  parts.push(`Subscription: ${subscription.name}`);
  parts.push(`Price: ${subscription.currency} ${subscription.price}`);
  parts.push(`Billing Cycle: ${subscription.billingCycle}`);

  if (subscription.category) {
    parts.push(`Category: ${subscription.category}`);
  }

  if (subscription.notes) {
    parts.push(`Notes: ${subscription.notes}`);
  }

  return parts.join("\n");
}

/**
 * Generates a Google Calendar URL for a subscription renewal reminder.
 * The URL opens Google Calendar with a prepopulated event.
 *
 * Requirements:
 * - 7.1: Event title "Renew [Subscription Name]"
 * - 7.2: Next payment date as event date
 * - 7.3: Subscription details in description
 *
 * @param subscription - The subscription to create a calendar event for
 * @returns Google Calendar URL string
 */
export function generateGoogleCalendarUrl(subscription: Subscription): string {
  const baseUrl = "https://calendar.google.com/calendar/render";

  // Event title: "Renew [Subscription Name]" (Requirement 7.1)
  const title = `Renew ${subscription.name}`;

  // Event date from nextPaymentDate (Requirement 7.2)
  // DB stores dates as strings, so we need to parse them
  const nextPaymentDate = new Date(subscription.nextPaymentDate);
  const dateStr = formatDateForCalendar(nextPaymentDate);

  // For all-day events, use the same date for start and end
  const dates = `${dateStr}/${dateStr}`;

  // Event description with subscription details (Requirement 7.3)
  const description = generateEventDescription(subscription);

  // Build URL with properly encoded parameters
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: dates,
    details: description,
  });

  return `${baseUrl}?${params.toString()}`;
}
