"use client";

/**
 * Subscription Sheet Component
 * Mobile-friendly Sheet/Drawer wrapper for the subscription form
 *
 * Requirements: 6.1, 6.4, 6.5
 */

import * as React from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SubscriptionForm } from "@/components/subscription-form";
import {
  createSubscription,
  updateSubscription,
} from "@/actions/subscriptions";
import type { CreateSubscriptionInput } from "@/lib/validations";
import type { Subscription } from "@/db/schema";

interface SubscriptionSheetProps {
  /** Existing subscription for edit mode, undefined for create mode */
  subscription?: Subscription;
  /** User ID from Clerk auth */
  userId: string;
  /** Callback when operation completes successfully */
  onComplete?: () => void;
  /** Custom trigger element (defaults to Add button) */
  trigger?: React.ReactNode;
  /** Control open state externally */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

export function SubscriptionSheet({
  subscription,
  userId,
  onComplete,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SubscriptionSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? controlledOnOpenChange ?? (() => {})
    : setInternalOpen;

  const isEditMode = !!subscription;

  const handleSubmit = async (data: CreateSubscriptionInput) => {
    setIsSubmitting(true);

    try {
      if (isEditMode && subscription) {
        // Update existing subscription
        const result = await updateSubscription(userId, subscription.id, data);

        if (result.success) {
          toast.success("Subscription updated", {
            description: `${data.name} has been updated successfully.`,
          });
        } else {
          toast.error("Failed to update subscription", {
            description: result.error || "An unexpected error occurred.",
          });
          throw new Error(result.error);
        }
      } else {
        // Create new subscription
        const result = await createSubscription(userId, data);

        if (result.success) {
          toast.success("Subscription created", {
            description: `${data.name} has been added to your subscriptions.`,
          });
        } else {
          toast.error("Failed to create subscription", {
            description: result.error || "An unexpected error occurred.",
          });
          throw new Error(result.error);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccess = () => {
    setOpen(false);
    onComplete?.();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // Default trigger button for create mode
  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Subscription
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto sm:h-auto sm:max-h-[90vh]">
        <SheetHeader>
          <SheetTitle>
            {isEditMode ? "Edit Subscription" : "Add New Subscription"}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update the details of your subscription below."
              : "Fill in the details to track a new subscription."}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 px-1">
          <SubscriptionForm
            subscription={subscription}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
