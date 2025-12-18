"use client";

/**
 * Summary Cards Component
 * Displays dashboard summary statistics: total spending, active count, trials ending soon
 *
 * Requirements: 5.1, 5.2, 5.3
 */

import { AlertTriangle, CreditCard, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Subscription } from "@/db/schema";

interface SummaryCardsProps {
  totalMonthlySpending: number;
  activeCount: number;
  trialsEndingSoon: Subscription[];
  currency: string;
}

/**
 * Formats a number as currency with proper locale formatting
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SummaryCards({
  totalMonthlySpending,
  activeCount,
  trialsEndingSoon,
  currency,
}: SummaryCardsProps) {
  const hasTrialsEndingSoon = trialsEndingSoon.length > 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Monthly Spending Card */}
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Spending</CardTitle>
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">
            {formatCurrency(totalMonthlySpending, currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Estimated monthly total
          </p>
        </CardContent>
      </Card>

      {/* Active Subscriptions Card */}
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
          <div className="p-2 rounded-lg bg-green-500/10">
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{activeCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Currently active
          </p>
        </CardContent>
      </Card>

      {/* Trials Ending Soon Card */}
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1",
          hasTrialsEndingSoon && "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
        )}
      >
        <div className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-bl-full",
          hasTrialsEndingSoon 
            ? "bg-gradient-to-br from-amber-500/20 to-transparent" 
            : "bg-gradient-to-br from-muted/50 to-transparent"
        )} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Trials Ending Soon</CardTitle>
          <div className={cn(
            "p-2 rounded-lg",
            hasTrialsEndingSoon ? "bg-amber-500/10" : "bg-muted"
          )}>
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                hasTrialsEndingSoon
                  ? "text-amber-500"
                  : "text-muted-foreground"
              )}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-3xl font-bold tracking-tight",
            hasTrialsEndingSoon && "text-amber-600 dark:text-amber-400"
          )}>
            {trialsEndingSoon.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {hasTrialsEndingSoon
              ? trialsEndingSoon.map((t) => t.name).join(", ")
              : "No trials ending soon"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
