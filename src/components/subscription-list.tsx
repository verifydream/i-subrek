"use client";

/**
 * Subscription List Component
 * Displays subscriptions in responsive grid (desktop) / list (mobile) layout
 * Integrates filtering by category and status
 *
 * Requirements: 5.4, 5.5, 9.2, 9.3
 */

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubscriptionCard } from "@/components/subscription-card";
import { filterByCategory, filterByStatus } from "@/lib/filtering";
import type { Subscription, Category, Status } from "@/db/schema";

const categoryOptions: Array<{ value: Category | "all"; label: string }> = [
  { value: "all", label: "All Categories" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Tools", label: "Tools" },
  { value: "Work", label: "Work" },
  { value: "Utilities", label: "Utilities" },
];

const statusOptions: Array<{ value: Status | "all"; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function SubscriptionList({
  subscriptions,
  onEdit,
  onDelete,
  onAdd,
}: SubscriptionListProps) {
  const [categoryFilter, setCategoryFilter] = React.useState<Category | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<Status | "all">("all");

  // Apply filters
  const filteredSubscriptions = React.useMemo(() => {
    let result = subscriptions;

    if (categoryFilter !== "all") {
      result = filterByCategory(result, categoryFilter);
    }

    if (statusFilter !== "all") {
      result = filterByStatus(result, statusFilter);
    }

    return result;
  }, [subscriptions, categoryFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value as Category | "all")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as Status | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      {/* Subscription Grid/List */}
      {filteredSubscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {subscriptions.length === 0
              ? "No subscriptions yet. Add your first one!"
              : "No subscriptions match your filters."}
          </p>
          {subscriptions.length === 0 && (
            <Button onClick={onAdd} variant="outline" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Subscription
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {subscriptions.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
        </p>
      )}
    </div>
  );
}
