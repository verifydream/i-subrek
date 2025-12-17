"use client";

/**
 * Subscription Sheet Component
 * Mobile-friendly Dialog/Sheet wrapper for the subscription form
 * Uses Dialog on desktop, Sheet on mobile for better UX
 *
 * Requirements: 6.1, 6.4, 6.5
 */

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubscriptionForm } from "@/components/subscription-form";
import {
  useCreateSubscription,
  useUpdateSubscription,
} from "@/hooks/use-subscriptions";
import { getPaymentMethods, getAccountCredentials } from "@/actions/master-data";
import type { CreateSubscriptionInput } from "@/lib/validations";
import type { Subscription } from "@/db/schema";
import type { PaymentMethod, AccountCredential } from "@/db/master-schema";

interface SubscriptionSheetProps {
  subscription?: Subscription;
  userId: string;
  onComplete?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
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
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>([]);
  const [accountCredentials, setAccountCredentials] = React.useState<AccountCredential[]>([]);

  const createMutation = useCreateSubscription(userId);
  const updateMutation = useUpdateSubscription(userId);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? controlledOnOpenChange ?? (() => {})
    : setInternalOpen;

  const isEditMode = !!subscription;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Fetch master data when dialog opens
  React.useEffect(() => {
    if (open && userId) {
      Promise.all([
        getPaymentMethods(userId),
        getAccountCredentials(userId),
      ]).then(([methods, credentials]) => {
        setPaymentMethods(methods);
        setAccountCredentials(credentials);
      });
    }
  }, [open, userId]);

  const handleSubmit = async (data: CreateSubscriptionInput) => {
    if (isEditMode && subscription) {
      await updateMutation.mutateAsync({
        subscriptionId: subscription.id,
        input: data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleSuccess = () => {
    setOpen(false);
    onComplete?.();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const defaultTrigger = (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      Add Subscription
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300">
        <DialogHeader className="p-6 pb-2 sticky top-0 bg-background z-10 border-b">
          <DialogTitle className="text-xl">
            {isEditMode ? "Edit Subscription" : "Add New Subscription"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of your subscription."
              : "Fill in the details to track a new subscription."}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-4">
          <SubscriptionForm
            subscription={subscription}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            paymentMethods={paymentMethods}
            accountCredentials={accountCredentials}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
