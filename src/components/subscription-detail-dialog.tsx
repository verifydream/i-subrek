"use client";

/**
 * Subscription Detail Dialog Component
 * Displays subscription details in a popup dialog
 */

import * as React from "react";
import { format } from "date-fns";
import { Calendar, CreditCard, Mail, FileText, Edit, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PasswordCopyButton } from "@/components/password-copy-button";
import { CalendarButton } from "@/components/calendar-button";
import { cn } from "@/lib/utils";
import type { Subscription, BillingCycle, Status } from "@/db/schema";

interface SubscriptionDetailDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function getBillingCycleLabel(cycle: BillingCycle): string {
  const labels: Record<BillingCycle, string> = {
    monthly: "Monthly",
    yearly: "Yearly",
    "one-time": "One-time",
    trial: "Trial",
  };
  return labels[cycle];
}

function getStatusColor(status: Status): string {
  const colors: Record<Status, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    expired: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  return colors[status];
}

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

function formatCurrency(amount: string, currency: string): string {
  const numAmount = parseFloat(amount);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

export function SubscriptionDetailDialog({
  subscription,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: SubscriptionDetailDialogProps) {
  if (!subscription) return null;

  const nextPaymentDate = new Date(subscription.nextPaymentDate);
  const startDate = new Date(subscription.startDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between pr-8">
            <div>
              <DialogTitle className="text-xl">{subscription.name}</DialogTitle>
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
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price */}
          <div className="text-center py-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-3xl font-bold">
              {formatCurrency(subscription.price, subscription.currency)}
            </p>
            <p className="text-muted-foreground">
              {getBillingCycleLabel(subscription.billingCycle as BillingCycle)}
            </p>
          </div>

          {/* Payment Schedule */}
          <div className="rounded-lg border p-4">
            <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
              <Calendar className="h-4 w-4" />
              Payment Schedule
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Next Payment</p>
                <p className="font-medium">{format(nextPaymentDate, "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Start Date</p>
                <p className="font-medium">{format(startDate, "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reminder</p>
                <p className="font-medium">{subscription.reminderDays} days before</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          {(subscription.paymentMethodProvider || subscription.paymentMethodNumber) && (
            <div className="rounded-lg border p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </h3>
              <div className="space-y-2 text-sm">
                {subscription.paymentMethodProvider && (
                  <div>
                    <p className="text-muted-foreground">Provider</p>
                    <p className="font-medium">{subscription.paymentMethodProvider}</p>
                  </div>
                )}
                {subscription.paymentMethodNumber && (
                  <div>
                    <p className="text-muted-foreground">Card Number</p>
                    <p className="font-mono font-medium">{subscription.paymentMethodNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Details */}
          {subscription.accountEmail && (
            <div className="rounded-lg border p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                <Mail className="h-4 w-4" />
                Account Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{subscription.accountEmail}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Password</p>
                  <PasswordCopyButton
                    subscriptionId={subscription.id}
                    hasPassword={!!subscription.accountPasswordEncrypted}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {subscription.notes && (
            <div className="rounded-lg border p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium mb-2">
                <FileText className="h-4 w-4" />
                Notes
              </h3>
              <p className="text-sm whitespace-pre-wrap">{subscription.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <CalendarButton subscription={subscription} />
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                onEdit(subscription.id);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onOpenChange(false);
                onDelete(subscription.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
            <span>Created: {format(new Date(subscription.createdAt), "MMM d, yyyy")}</span>
            <span>•</span>
            <span>Updated: {format(new Date(subscription.updatedAt), "MMM d, yyyy")}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
