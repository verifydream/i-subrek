"use client";

/**
 * Subscription Card Component
 * Displays individual subscription with name, price, next payment date, category
 * Highlights items within reminder days
 *
 * Requirements: 5.6
 */

import { format } from "date-fns";
import { Calendar, Edit, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isWithinReminderDays } from "@/lib/date-utils";
import type { Subscription, BillingCycle } from "@/db/schema";

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
}

/**
 * Formats a number as currency with proper locale formatting
 */
function formatCurrency(amount: string, currency: string): string {
  const numAmount = parseFloat(amount);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

/**
 * Returns a human-readable billing cycle label
 */
function getBillingCycleLabel(cycle: BillingCycle): string {
  const labels: Record<BillingCycle, string> = {
    monthly: "/mo",
    yearly: "/yr",
    "one-time": "once",
    trial: "trial",
  };
  return labels[cycle];
}

/**
 * Returns category badge color classes
 */
function getCategoryColor(category: string | null): string {
  if (!category) return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  
  const colors: Record<string, string> = {
    Entertainment: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    Tools: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Work: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Utilities: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  };
  return colors[category] || colors.Entertainment;
}

export function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
  onClick,
}: SubscriptionCardProps) {
  const nextPaymentDate = new Date(subscription.nextPaymentDate);
  const isHighlighted = isWithinReminderDays(
    nextPaymentDate,
    subscription.reminderDays
  );

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 ease-out cursor-pointer",
        "hover:shadow-lg hover:-translate-y-1 hover:border-primary/50",
        "active:scale-[0.98]",
        isHighlighted && "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 animate-pulse-border"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            {subscription.name}
          </CardTitle>
          {subscription.category && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                getCategoryColor(subscription.category)
              )}
            >
              {subscription.category}
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(subscription.id);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(subscription.id);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight">
            {formatCurrency(subscription.price, subscription.currency)}
          </span>
          <span className="text-sm text-muted-foreground font-medium">
            {getBillingCycleLabel(subscription.billingCycle as BillingCycle)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md",
            isHighlighted 
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" 
              : "bg-muted/50 text-muted-foreground"
          )}>
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium">
              {isHighlighted ? "Due " : "Next: "}
              {format(nextPaymentDate, "MMM d, yyyy")}
            </span>
          </div>
        </div>
        {subscription.status !== "active" && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
              subscription.status === "cancelled"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            )}
          >
            {subscription.status}
          </span>
        )}
        {/* Hover indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </CardContent>
    </Card>
  );
}
