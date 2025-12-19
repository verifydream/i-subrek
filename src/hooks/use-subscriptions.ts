"use client";

/**
 * TanStack Query hook for subscription data management
 * Provides caching, optimistic updates, and automatic refetching
 *
 * Requirements: 2.1, 2.3, 2.4
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "@/actions/subscriptions";
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from "@/lib/validations";
import type { Subscription } from "@/db/schema";

// Query keys
export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  lists: () => [...subscriptionKeys.all, "list"] as const,
  list: (userId: string) => [...subscriptionKeys.lists(), userId] as const,
  details: () => [...subscriptionKeys.all, "detail"] as const,
  detail: (id: string) => [...subscriptionKeys.details(), id] as const,
};

/**
 * Hook to fetch all subscriptions for the current user
 */
export function useSubscriptions(userId: string | null) {
  return useQuery({
    queryKey: subscriptionKeys.list(userId ?? ""),
    queryFn: async () => {
      if (!userId) return [];
      return getSubscriptions(userId);
    },
    enabled: !!userId,
  });
}

/**
 * Hook to create a new subscription with optimistic updates
 */
export function useCreateSubscription(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSubscriptionInput) => {
      const result = await createSubscription(userId, input);
      if (!result.success) {
        throw new Error(result.error || "Failed to create subscription");
      }
      return result.data!;
    },
    onMutate: async (newSubscription) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: subscriptionKeys.list(userId),
      });

      // Snapshot the previous value
      const previousSubscriptions = queryClient.getQueryData<Subscription[]>(
        subscriptionKeys.list(userId)
      );

      // Optimistically update to the new value
      if (previousSubscriptions) {
        const optimisticSubscription: Subscription = {
          id: `temp-${Date.now()}`,
          userId,
          name: newSubscription.name,
          price: newSubscription.price.toString(),
          currency: newSubscription.currency,
          billingCycle: newSubscription.billingCycle,
          startDate: newSubscription.startDate.toISOString().split("T")[0],
          nextPaymentDate: newSubscription.startDate.toISOString().split("T")[0],
          reminderDays: newSubscription.reminderDays,
          paymentMethodProvider: newSubscription.paymentMethodProvider || null,
          paymentMethodNumber: newSubscription.paymentMethodNumber
            ? `**** ${newSubscription.paymentMethodNumber.slice(-4)}`
            : null,
          accountEmail: newSubscription.accountEmail || null,
          accountPasswordEncrypted: newSubscription.accountPassword ? "encrypted" : null,
          notes: newSubscription.notes || null,
          category: newSubscription.category || null,
          url: newSubscription.url || null,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        queryClient.setQueryData<Subscription[]>(
          subscriptionKeys.list(userId),
          [...previousSubscriptions, optimisticSubscription]
        );
      }

      return { previousSubscriptions };
    },
    onError: (err, _newSubscription, context) => {
      // Rollback on error
      if (context?.previousSubscriptions) {
        queryClient.setQueryData(
          subscriptionKeys.list(userId),
          context.previousSubscriptions
        );
      }
      toast.error("Failed to create subscription", {
        description: err.message,
      });
    },
    onSuccess: (data) => {
      toast.success("Subscription created", {
        description: `${data.name} has been added to your subscriptions.`,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.list(userId),
      });
    },
  });
}

/**
 * Hook to update a subscription with optimistic updates
 */
export function useUpdateSubscription(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      input,
    }: {
      subscriptionId: string;
      input: UpdateSubscriptionInput;
    }) => {
      const result = await updateSubscription(userId, subscriptionId, input);
      if (!result.success) {
        throw new Error(result.error || "Failed to update subscription");
      }
      return result.data!;
    },
    onMutate: async ({ subscriptionId, input }) => {
      await queryClient.cancelQueries({
        queryKey: subscriptionKeys.list(userId),
      });

      const previousSubscriptions = queryClient.getQueryData<Subscription[]>(
        subscriptionKeys.list(userId)
      );

      if (previousSubscriptions) {
        queryClient.setQueryData<Subscription[]>(
          subscriptionKeys.list(userId),
          previousSubscriptions.map((sub) =>
            sub.id === subscriptionId
              ? {
                  ...sub,
                  name: input.name ?? sub.name,
                  price: input.price?.toString() ?? sub.price,
                  currency: input.currency ?? sub.currency,
                  billingCycle: input.billingCycle ?? sub.billingCycle,
                  startDate: input.startDate?.toISOString().split("T")[0] ?? sub.startDate,
                  nextPaymentDate: input.nextPaymentDate?.toISOString().split("T")[0] ?? sub.nextPaymentDate,
                  reminderDays: input.reminderDays ?? sub.reminderDays,
                  paymentMethodProvider: input.paymentMethodProvider ?? sub.paymentMethodProvider,
                  accountEmail: input.accountEmail ?? sub.accountEmail,
                  notes: input.notes ?? sub.notes,
                  category: input.category ?? sub.category,
                  url: input.url ?? sub.url,
                  status: input.status ?? sub.status,
                  updatedAt: new Date(),
                }
              : sub
          )
        );
      }

      return { previousSubscriptions };
    },
    onError: (err, _variables, context) => {
      if (context?.previousSubscriptions) {
        queryClient.setQueryData(
          subscriptionKeys.list(userId),
          context.previousSubscriptions
        );
      }
      toast.error("Failed to update subscription", {
        description: err.message,
      });
    },
    onSuccess: (data) => {
      toast.success("Subscription updated", {
        description: `${data.name} has been updated successfully.`,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.list(userId),
      });
    },
  });
}

/**
 * Hook to delete a subscription with optimistic updates
 */
export function useDeleteSubscription(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const result = await deleteSubscription(userId, subscriptionId);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete subscription");
      }
      return subscriptionId;
    },
    onMutate: async (subscriptionId) => {
      await queryClient.cancelQueries({
        queryKey: subscriptionKeys.list(userId),
      });

      const previousSubscriptions = queryClient.getQueryData<Subscription[]>(
        subscriptionKeys.list(userId)
      );

      if (previousSubscriptions) {
        queryClient.setQueryData<Subscription[]>(
          subscriptionKeys.list(userId),
          previousSubscriptions.filter((sub) => sub.id !== subscriptionId)
        );
      }

      return { previousSubscriptions };
    },
    onError: (err, _subscriptionId, context) => {
      if (context?.previousSubscriptions) {
        queryClient.setQueryData(
          subscriptionKeys.list(userId),
          context.previousSubscriptions
        );
      }
      toast.error("Failed to delete subscription", {
        description: err.message,
      });
    },
    onSuccess: (_data, subscriptionId) => {
      const previousSubscriptions = queryClient.getQueryData<Subscription[]>(
        subscriptionKeys.list(userId)
      );
      const deletedSub = previousSubscriptions?.find((s) => s.id === subscriptionId);
      toast.success("Subscription deleted", {
        description: deletedSub
          ? `${deletedSub.name} has been removed.`
          : "Subscription has been removed.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.list(userId),
      });
    },
  });
}
