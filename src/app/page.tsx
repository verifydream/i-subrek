"use client";

/**
 * Dashboard Page
 * Main page displaying subscription summaries and list
 * Uses TanStack Query for data fetching and optimistic updates
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import * as React from "react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

import { Header } from "@/components/header";
import { SummaryCards } from "@/components/summary-cards";
import { SubscriptionList } from "@/components/subscription-list";
import { SubscriptionSheet } from "@/components/subscription-sheet";
import {
  useSubscriptions,
  useDeleteSubscription,
} from "@/hooks/use-subscriptions";
import {
  calculateTotalMonthlySpending,
  countActiveSubscriptions,
  getTrialsEndingSoon,
} from "@/lib/calculations";
import { useAuth } from "@/hooks/use-auth";
import type { Subscription } from "@/db/schema";

const TRIALS_THRESHOLD_DAYS = 7;
const DEFAULT_CURRENCY = "IDR";

function DashboardContent() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [editingSubscription, setEditingSubscription] = React.useState<Subscription | undefined>();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  // TanStack Query hooks
  const { data: subscriptions = [], isLoading } = useSubscriptions(userId ?? null);
  const deleteSubscriptionMutation = useDeleteSubscription(userId ?? "");

  // Calculate dashboard metrics
  const totalMonthlySpending = calculateTotalMonthlySpending(subscriptions);
  const activeCount = countActiveSubscriptions(subscriptions);
  const trialsEndingSoon = getTrialsEndingSoon(subscriptions, TRIALS_THRESHOLD_DAYS);

  // Handlers
  const handleAdd = () => {
    setEditingSubscription(undefined);
    setIsSheetOpen(true);
  };

  const handleEdit = (id: string) => {
    const subscription = subscriptions.find((s) => s.id === id);
    if (subscription) {
      setEditingSubscription(subscription);
      setIsSheetOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    deleteSubscriptionMutation.mutate(id);
  };

  const handleSheetComplete = () => {
    setIsSheetOpen(false);
    setEditingSubscription(undefined);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading subscriptions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Decorative background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>
      
      <Header />
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your subscriptions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8">
          <SummaryCards
            totalMonthlySpending={totalMonthlySpending}
            activeCount={activeCount}
            trialsEndingSoon={trialsEndingSoon}
            currency={DEFAULT_CURRENCY}
          />
        </div>

        {/* Subscription List */}
        <SubscriptionList
          subscriptions={subscriptions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />

        {/* Subscription Sheet for Add/Edit */}
        {userId && (
          <SubscriptionSheet
            subscription={editingSubscription}
            userId={userId}
            open={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            onComplete={handleSheetComplete}
            trigger={<span className="hidden" />}
          />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SignedIn>
        <DashboardContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
