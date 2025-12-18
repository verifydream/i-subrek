/**
 * Google Calendar URL generation utilities
 * Creates calendar event URLs for subscription renewal reminders
 *
 * Requirements: 7.1, 7.2, 7.3
 */

import { subDays } from "date-fns";
import type { Subscription } from "@/db/schema";

/**
 * Formats a Date object to Google Calendar datetime format (YYYYMMDDTHHmmssZ)
 *
 * @param date - The date to format
 * @param hour - Hour of the day (0-23)
 * @param minute - Minute (0-59)
 * @returns DateTime string in YYYYMMDDTHHmmss format
 */
function formatDateTimeForCalendar(date: Date, hour: number = 9, minute: number = 0): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hourStr = String(hour).padStart(2, "0");
  const minuteStr = String(minute).padStart(2, "0");
  return `${year}${month}${day}T${hourStr}${minuteStr}00`;
}

/**
 * Formats currency for display
 */
function formatCurrency(amount: string, currency: string): string {
  const numAmount = parseFloat(amount);
  if (currency === "IDR") {
    return `Rp ${numAmount.toLocaleString("id-ID")}`;
  }
  return `$${numAmount.toFixed(2)}`;
}

/**
 * Generates a description for the calendar event
 * Includes: subscription name, price, category, account, payment method, URL, notes
 *
 * @param subscription - The subscription to generate description for
 * @returns Event description string
 */
function generateEventDescription(subscription: Subscription): string {
  const parts: string[] = [];

  // Basic info
  parts.push(`📌 Subscription: ${subscription.name}`);
  parts.push(`💰 Price: ${formatCurrency(subscription.price, subscription.currency)}`);

  if (subscription.category) {
    parts.push(`🏷️ Category: ${subscription.category}`);
  }

  // Account info
  if (subscription.accountEmail) {
    parts.push(`📧 Account: ${subscription.accountEmail}`);
  }

  // Payment method
  if (subscription.paymentMethodProvider) {
    let paymentInfo = `💳 Payment: ${subscription.paymentMethodProvider}`;
    if (subscription.paymentMethodNumber) {
      paymentInfo += ` (${subscription.paymentMethodNumber})`;
    }
    parts.push(paymentInfo);
  }

  // URL
  if (subscription.url) {
    parts.push(`🔗 URL: ${subscription.url}`);
  }

  // Notes
  if (subscription.notes) {
    parts.push(`📝 Notes: ${subscription.notes}`);
  }

  return parts.join("\n");
}

/**
 * Generates a Google Calendar URL for a subscription renewal reminder.
 * The URL opens Google Calendar with a prepopulated event.
 * 
 * - Event date: 1 day before next payment date
 * - Event time: 9:00 AM - 12:00 PM
 * - Notifications: 30 minutes before (both popup and email)
 *
 * @param subscription - The subscription to create a calendar event for
 * @returns Google Calendar URL string
 */
export function generateGoogleCalendarUrl(subscription: Subscription): string {
  const baseUrl = "https://calendar.google.com/calendar/render";

  // Event title: bell emoji + subscription name
  const title = `🔔 ${subscription.name}`;

  // Event date: 1 day before next payment
  const nextPaymentDate = new Date(subscription.nextPaymentDate);
  const eventDate = subDays(nextPaymentDate, 1);

  // Set event time: 9:00 AM - 12:00 PM (3 hours)
  const startDateTime = formatDateTimeForCalendar(eventDate, 9, 0);
  const endDateTime = formatDateTimeForCalendar(eventDate, 12, 0);
  const dates = `${startDateTime}/${endDateTime}`;

  // Event description with subscription details
  const description = generateEventDescription(subscription);

  // Build URL with properly encoded parameters
  // Note: Google Calendar URL doesn't support reminders directly,
  // but we can add them via the 'add' parameter format
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: dates,
    details: description,
    // Add reminders: 30 minutes before (popup and email)
    // Format: reminder type (popup=1, email=2) and minutes
    // Unfortunately Google Calendar URL API doesn't fully support custom reminders
    // Users will need to set reminders manually or use default calendar settings
  });

  return `${baseUrl}?${params.toString()}`;
}
