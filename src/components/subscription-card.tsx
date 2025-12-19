"use client";

/**
 * Subscription Card Component
 * Displays individual subscription with name, price, next payment date, category
 * Highlights items within reminder days
 *
 * Requirements: 5.6
 */

import { format } from "date-fns";
import { Calendar, Edit, MoreVertical, Trash2, Sparkles } from "lucide-react";
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

// Get color based on days remaining
function getDaysRemainingColor(daysRemaining: number): { gradient: string; accent: string; text: string } {
  if (daysRemaining <= 3) {
    // Critical - Red
    return {
      gradient: "from-red-500/15 via-red-500/5 to-transparent",
      accent: "bg-gradient-to-r from-red-500 to-rose-500",
      text: "text-red-600 dark:text-red-400"
    };
  } else if (daysRemaining <= 7) {
    // Warning - Orange
    return {
      gradient: "from-orange-500/15 via-amber-500/5 to-transparent",
      accent: "bg-gradient-to-r from-orange-500 to-amber-500",
      text: "text-orange-600 dark:text-orange-400"
    };
  } else if (daysRemaining <= 14) {
    // Caution - Yellow
    return {
      gradient: "from-yellow-500/15 via-yellow-500/5 to-transparent",
      accent: "bg-gradient-to-r from-yellow-500 to-amber-400",
      text: "text-yellow-600 dark:text-yellow-400"
    };
  } else if (daysRemaining <= 30) {
    // Normal - Blue
    return {
      gradient: "from-blue-500/10 via-cyan-500/5 to-transparent",
      accent: "bg-gradient-to-r from-blue-500 to-cyan-500",
      text: "text-blue-600 dark:text-blue-400"
    };
  } else {
    // Safe - Green
    return {
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      accent: "bg-gradient-to-r from-emerald-500 to-teal-500",
      text: "text-emerald-600 dark:text-emerald-400"
    };
  }
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
    General: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
  };
  return colors[category] || "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
}

export function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
  onClick,
}: SubscriptionCardProps) {
  const nextPaymentDate = new Date(subscription.nextPaymentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysRemaining = Math.ceil((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const isHighlighted = isWithinReminderDays(
    nextPaymentDate,
    subscription.reminderDays
  );
  
  const colors = getDaysRemainingColor(daysRemaining);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 ease-out cursor-pointer",
        "hover:shadow-xl hover:-translate-y-1.5",
        "active:scale-[0.98]",
        "border-0 shadow-md",
        isHighlighted && "ring-2 ring-amber-500 animate-pulse-border"
      )}
      onClick={onClick}
    >
      {/* Gradient background based on days remaining */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-70",
        colors.gradient
      )} />
      
      {/* Top accent line based on days remaining */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        colors.accent
      )} />
      
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative">
        <div className="space-y-1.5">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {subscription.name}
            {isHighlighted && <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />}
          </CardTitle>
          {subscription.category && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
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
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
      <CardContent className="space-y-3 pt-0 relative">
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
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
            isHighlighted 
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 font-semibold" 
              : "bg-white/50 dark:bg-white/5 text-muted-foreground backdrop-blur-sm"
          )}>
            <Calendar className="h-3.5 w-3.5" />
            <span>
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
        {/* Days remaining badge */}
        <div className={cn(
          "absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold",
          daysRemaining <= 3 ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
          daysRemaining <= 7 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" :
          daysRemaining <= 14 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" :
          daysRemaining <= 30 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
        )}>
          {daysRemaining <= 0 ? "Expired" : `${daysRemaining}d`}
        </div>
        
        {/* Hover indicator */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left",
          colors.accent
        )} />
      </CardContent>
    </Card>
  );
}
