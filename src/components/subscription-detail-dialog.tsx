"use client";

/**
 * Subscription Detail Dialog Component
 * Displays subscription details in a popup dialog
 */

import * as React from "react";
import { format } from "date-fns";
import { Calendar, CreditCard, Mail, FileText, Edit, Trash2, Link as LinkIcon, Chrome, Github, KeyRound, Clock, Gift, CreditCard as SubscriptionIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { PasswordCopyButton } from "@/components/password-copy-button";
import { CalendarButton } from "@/components/calendar-button";
import { cn } from "@/lib/utils";
import type { Subscription, BillingCycle, Status, SubscriptionType } from "@/db/schema";

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

function getSubscriptionTypeInfo(type: SubscriptionType | undefined): { label: string; color: string; icon: typeof Clock } {
  const types: Record<SubscriptionType, { label: string; color: string; icon: typeof Clock }> = {
    trial: { label: "Trial", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: Clock },
    voucher: { label: "Voucher", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: Gift },
    subscription: { label: "Langganan", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: SubscriptionIcon },
  };
  return types[type || "trial"];
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
  const subscriptionTypeInfo = getSubscriptionTypeInfo((subscription as any).subscriptionType);
  const TypeIcon = subscriptionTypeInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
          <VisuallyHidden>
            <DialogDescription>Details for {subscription.name} subscription</DialogDescription>
          </VisuallyHidden>
          <div className="flex items-start justify-between pr-8">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold">{subscription.name}</DialogTitle>
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                    getStatusColor(subscription.status as Status)
                  )}
                >
                  {subscription.status}
                </span>
                {/* Subscription Type Badge */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                    subscriptionTypeInfo.color
                  )}
                >
                  <TypeIcon className="h-3 w-3" />
                  {subscriptionTypeInfo.label}
                </span>
                {subscription.category && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
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

        <div className="p-6 space-y-5">
          {/* Price - Different display based on subscription type */}
          <div className="text-center py-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
              {(subscription as any).subscriptionType === "trial" ? "Status" : 
               (subscription as any).subscriptionType === "voucher" ? "Nominal Voucher" : "Price"}
            </p>
            {(subscription as any).subscriptionType === "trial" ? (
              <p className="text-4xl font-bold mt-1 tracking-tight text-blue-600 dark:text-blue-400">
                Gratis
              </p>
            ) : (
              <p className="text-4xl font-bold mt-1 tracking-tight">
                {formatCurrency(subscription.price, subscription.currency)}
              </p>
            )}
            <p className="text-muted-foreground mt-1 font-medium">
              {(subscription as any).subscriptionType === "trial" ? "Trial Period" :
               (subscription as any).subscriptionType === "voucher" ? "Voucher/Gift Card" :
               getBillingCycleLabel(subscription.billingCycle as BillingCycle)}
            </p>
          </div>

          {/* URL */}
          {subscription.url && (
            <div className="rounded-xl border p-4 space-y-3 hover:border-primary/30 transition-colors">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="p-1.5 rounded-lg bg-indigo-500/10">
                  <LinkIcon className="h-4 w-4 text-indigo-500" />
                </div>
                Subscription URL
              </h3>
              <a 
                href={subscription.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {subscription.url}
              </a>
            </div>
          )}

          {/* Payment Schedule */}
          <div className="rounded-xl border p-4 space-y-3 hover:border-primary/30 transition-colors">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              Payment Schedule
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Next Payment</p>
                <p className="font-semibold">{format(nextPaymentDate, "MMM d, yyyy")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Start Date</p>
                <p className="font-semibold">{format(startDate, "MMM d, yyyy")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Reminder</p>
                <p className="font-semibold">{subscription.reminderDays} days before</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          {(subscription.paymentMethodProvider || subscription.paymentMethodNumber) && (
            <div className="rounded-xl border p-4 space-y-3 hover:border-primary/30 transition-colors">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                </div>
                Payment Method
              </h3>
              <div className="space-y-3 text-sm">
                {subscription.paymentMethodProvider && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-semibold">{subscription.paymentMethodProvider}</span>
                  </div>
                )}
                {subscription.paymentMethodNumber && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Account/Card</span>
                    <span className="font-mono font-semibold text-primary">{subscription.paymentMethodNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Details */}
          {subscription.accountEmail && (
            <div className="rounded-xl border p-4 space-y-3 hover:border-primary/30 transition-colors">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="p-1.5 rounded-lg bg-green-500/10">
                  <Mail className="h-4 w-4 text-green-500" />
                </div>
                Account Details
              </h3>
              <div className="space-y-3 text-sm">
                {(subscription as any).accountLoginMethod && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Login Method</span>
                    <span className="font-semibold flex items-center gap-2">
                      {(subscription as any).accountLoginMethod.toLowerCase().includes("google") ? (
                        <Chrome className="h-4 w-4 text-blue-500" />
                      ) : (subscription as any).accountLoginMethod.toLowerCase().includes("github") ? (
                        <Github className="h-4 w-4" />
                      ) : (subscription as any).accountLoginMethod.toLowerCase().includes("email") ? (
                        <Mail className="h-4 w-4 text-green-500" />
                      ) : (
                        <KeyRound className="h-4 w-4 text-violet-500" />
                      )}
                      {(subscription as any).accountLoginMethod}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-semibold break-all text-right max-w-[200px]">{subscription.accountEmail}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Password</span>
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
            <div className="rounded-xl border p-4 space-y-3 hover:border-primary/30 transition-colors">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="p-1.5 rounded-lg bg-purple-500/10">
                  <FileText className="h-4 w-4 text-purple-500" />
                </div>
                Notes
              </h3>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">{subscription.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-3">
            <CalendarButton subscription={subscription} />
            <Button
              variant="outline"
              className="flex-1 h-11 font-medium"
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
              className="h-11"
              onClick={() => {
                onOpenChange(false);
                onDelete(subscription.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-3 pb-2 border-t mt-4">
            <span>Created {format(new Date(subscription.createdAt), "MMM d, yyyy")}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>Updated {format(new Date(subscription.updatedAt), "MMM d, yyyy")}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
