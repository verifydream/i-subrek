"use client";

/**
 * Calendar Button Component
 * Generates and opens Google Calendar URL for subscription renewal reminders
 *
 * Requirements: 7.4
 */

import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateGoogleCalendarUrl } from "@/lib/calendar";
import type { Subscription } from "@/db/schema";

interface CalendarButtonProps {
  subscription: Subscription;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function CalendarButton({
  subscription,
  variant = "outline",
  size = "default",
}: CalendarButtonProps) {
  const handleAddToCalendar = () => {
    const calendarUrl = generateGoogleCalendarUrl(subscription);
    // Open Google Calendar in a new tab (Requirement 7.4)
    window.open(calendarUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCalendar}
      className="gap-2"
    >
      <CalendarPlus className="h-4 w-4" />
      Add to Calendar
    </Button>
  );
}
