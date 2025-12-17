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
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Monthly Spending Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalMonthlySpending, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            Estimated monthly total
          </p>
        </CardContent>
      </Card>

      {/* Active Subscriptions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeCount}</div>
          <p className="text-xs text-muted-foreground">
            Currently active
          </p>
        </CardContent>
      </Card>

      {/* Trials Ending Soon Card */}
      <Card
        className={cn(
          hasTrialsEndingSoon && "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trials Ending Soon</CardTitle>
          <AlertTriangle
            className={cn(
              "h-4 w-4",
              hasTrialsEndingSoon
                ? "text-amber-500"
                : "text-muted-foreground"
            )}
          />
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold",
            hasTrialsEndingSoon && "text-amber-600 dark:text-amber-400"
          )}>
            {trialsEndingSoon.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {hasTrialsEndingSoon
              ? trialsEndingSoon.map((t) => t.name).join(", ")
              : "No trials ending soon"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
