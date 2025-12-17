"use server";

/**
 * Subscription Detail Page
 * Displays all subscription information including masked payment method
 *
 * Requirements: 3.2
 */

import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, CreditCard, Mail, FileText } from "lucide-react";
import Link from "next/link";
import { getSubscriptionById } from "@/actions/subscriptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordCopyButton } from "@/components/password-copy-button";
import { CalendarButton } from "@/components/calendar-button";
import { cn } from "@/lib/utils";
import type { BillingCycle, Status } from "@/db/schema";

interface SubscriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Returns a human-readable billing cycle label
 */
function getBillingCycleLabel(cycle: BillingCycle): string {
  const labels: Record<BillingCycle, string> = {
    monthly: "Monthly",
    yearly: "Yearly",
    "one-time": "One-time",
    trial: "Trial",
  };
  return labels[cycle];
}

/**
 * Returns status badge color classes
 */
function getStatusColor(status: Status): string {
  const colors: Record<Status, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    expired: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  return colors[status];
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
  return colors[category] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
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

export default async function SubscriptionDetailPage({
  params,
}: SubscriptionDetailPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const subscription = await getSubscriptionById(userId, id);

  if (!subscription) {
    notFound();
  }

  const nextPaymentDate = new Date(subscription.nextPaymentDate);
  const startDate = new Date(subscription.startDate);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {subscription.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    getStatusColor(subscription.status as Status)
                  )}
                >
                  {subscription.status}
                </span>
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
            </div>
            <CalendarButton subscription={subscription} />
          </div>
        </div>

        {/* Price Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-4xl font-bold">
                {formatCurrency(subscription.price, subscription.currency)}
              </p>
              <p className="text-muted-foreground">
                {getBillingCycleLabel(subscription.billingCycle as BillingCycle)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Payment Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Payment Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Next Payment</p>
                <p className="font-medium">
                  {format(nextPaymentDate, "MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {format(startDate, "MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reminder</p>
                <p className="font-medium">
                  {subscription.reminderDays} days before
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {subscription.paymentMethodProvider && (
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-medium">{subscription.paymentMethodProvider}</p>
                </div>
              )}
              {subscription.paymentMethodNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Card Number</p>
                  <p className="font-mono font-medium">
                    {subscription.paymentMethodNumber}
                  </p>
                </div>
              )}
              {!subscription.paymentMethodProvider && !subscription.paymentMethodNumber && (
                <p className="text-sm text-muted-foreground">No payment method stored</p>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {subscription.accountEmail && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{subscription.accountEmail}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Password</p>
                <PasswordCopyButton
                  subscriptionId={subscription.id}
                  hasPassword={!!subscription.accountPasswordEncrypted}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          {subscription.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{subscription.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timestamps */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Created: {format(new Date(subscription.createdAt), "MMM d, yyyy")}</span>
          <span>•</span>
          <span>Updated: {format(new Date(subscription.updatedAt), "MMM d, yyyy")}</span>
        </div>
      </div>
    </div>
  );
}
