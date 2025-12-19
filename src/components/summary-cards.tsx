"use client";

/**
 * Summary Cards Component
 * Displays dashboard summary statistics: total spending, active count, trials ending soon
 *
 * Requirements: 5.1, 5.2, 5.3
 */

import { AlertTriangle, CreditCard, TrendingUp, Sparkles } from "lucide-react";
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
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
          <CardTitle className="text-sm font-medium text-white/80">Monthly Spending</CardTitle>
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold tracking-tight">
            {formatCurrency(totalMonthlySpending, currency)}
          </div>
          <p className="text-sm text-white/70 mt-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Estimated monthly total
          </p>
        </CardContent>
      </Card>

      {/* Active Subscriptions Card */}
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
          <CardTitle className="text-sm font-medium text-white/80">Active Subscriptions</CardTitle>
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold tracking-tight">{activeCount}</div>
          <p className="text-sm text-white/70 mt-1">
            Currently active
          </p>
        </CardContent>
      </Card>

      {/* Trials Ending Soon Card */}
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 sm:col-span-2 lg:col-span-1 border-0",
          hasTrialsEndingSoon 
            ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white" 
            : "bg-gradient-to-br from-slate-500 to-slate-600 text-white"
        )}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
          <CardTitle className="text-sm font-medium text-white/80">Trials Ending Soon</CardTitle>
          <div className={cn(
            "p-2.5 rounded-xl backdrop-blur-sm",
            hasTrialsEndingSoon ? "bg-white/20" : "bg-white/10"
          )}>
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold tracking-tight">
            {trialsEndingSoon.length}
          </div>
          <p className="text-sm text-white/70 mt-1 truncate">
            {hasTrialsEndingSoon
              ? trialsEndingSoon.map((t) => t.name).join(", ")
              : "No trials ending soon"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
