"use client";

/**
 * Subscription Form Component
 * Create/edit form with React Hook Form and Zod validation
 *
 * Requirements: 6.2, 6.3, 4.3
 */

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  createSubscriptionSchema,
  billingCycleValues,
  categoryValues,
  currencyValues,
  type CreateSubscriptionInput,
  type CreateSubscriptionFormInput,
} from "@/lib/validations";
import { calculateNextPaymentDate } from "@/lib/date-utils";
import type { Subscription, BillingCycle } from "@/db/schema";

// Login method options for conditional password field
const loginMethodOptions = [
  { value: "email", label: "Email/Password" },
  { value: "google", label: "Google" },
  { value: "github", label: "GitHub" },
  { value: "other", label: "Other OAuth" },
] as const;

type LoginMethod = (typeof loginMethodOptions)[number]["value"];

interface SubscriptionFormProps {
  /** Existing subscription for edit mode, undefined for create mode */
  subscription?: Subscription;
  /** Callback when form submission succeeds */
  onSuccess: () => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Submit handler - receives validated form data */
  onSubmit: (data: CreateSubscriptionInput) => Promise<void>;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
}

export function SubscriptionForm({
  subscription,
  onSuccess,
  onCancel,
  onSubmit,
  isSubmitting = false,
}: SubscriptionFormProps) {
  const isEditMode = !!subscription;

  // Track login method for conditional password field
  const [loginMethod, setLoginMethod] = React.useState<LoginMethod>("email");

  // Initialize form with default values or existing subscription data
  const form = useForm<CreateSubscriptionFormInput>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      name: subscription?.name ?? "",
      price: subscription?.price ? parseFloat(subscription.price) : undefined,
      currency: (subscription?.currency as "IDR" | "USD") ?? "IDR",
      billingCycle: subscription?.billingCycle ?? "monthly",
      startDate: subscription?.startDate
        ? new Date(subscription.startDate)
        : new Date(),
      reminderDays: subscription?.reminderDays ?? 3,
      paymentMethodProvider: subscription?.paymentMethodProvider ?? "",
      paymentMethodNumber: "", // Never pre-fill - it's masked in DB
      accountEmail: subscription?.accountEmail ?? "",
      accountPassword: "", // Never pre-fill - it's encrypted in DB
      notes: subscription?.notes ?? "",
      category: subscription?.category ?? undefined,
    },
  });

  // Watch billing cycle and start date for next payment preview
  const watchedBillingCycle = form.watch("billingCycle");
  const watchedStartDate = form.watch("startDate");

  // Calculate next payment date preview
  const nextPaymentPreview = React.useMemo(() => {
    if (!watchedStartDate || !watchedBillingCycle) return null;
    try {
      return calculateNextPaymentDate(
        watchedStartDate,
        watchedBillingCycle as BillingCycle
      );
    } catch {
      return null;
    }
  }, [watchedStartDate, watchedBillingCycle]);

  // Handle form submission
  const handleSubmit = async (data: CreateSubscriptionFormInput) => {
    try {
      // Zod will apply defaults, so we cast to the output type
      await onSubmit(data as CreateSubscriptionInput);
      onSuccess();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Check if password field should be hidden (Google/GitHub login)
  const shouldHidePassword =
    loginMethod === "google" ||
    loginMethod === "github" ||
    loginMethod === "other";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscription Name</FormLabel>
              <FormControl>
                <Input placeholder="Netflix, Spotify, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price and Currency Row */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseFloat(value) : undefined);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencyValues.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Billing Cycle Field */}
        <FormField
          control={form.control}
          name="billingCycle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Cycle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select billing cycle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {billingCycleValues.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start Date Field */}
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={field.onChange}
                  placeholder="Select start date"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Next Payment Date Preview */}
        {nextPaymentPreview && (
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              Next payment date:{" "}
              <span className="font-medium text-foreground">
                {format(nextPaymentPreview, "PPP")}
              </span>
            </p>
          </div>
        )}

        {/* Reminder Days Field */}
        <FormField
          control={form.control}
          name="reminderDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reminder Days</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  {...field}
                  value={field.value ?? 3}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormDescription>
                Days before payment to highlight subscription
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Field */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryValues.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Method Section */}
        <div className="space-y-4 rounded-md border p-4">
          <h3 className="text-sm font-medium">Payment Method (Optional)</h3>

          <FormField
            control={form.control}
            name="paymentMethodProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <FormControl>
                  <Input placeholder="GoPay, BCA, Jenius, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethodNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card/Account Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter full number (will be masked)"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Only last 4 digits will be stored
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Account Credentials Section */}
        <div className="space-y-4 rounded-md border p-4">
          <h3 className="text-sm font-medium">
            Account Credentials (Optional)
          </h3>

          {/* Login Method Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Login Method</label>
            <Select
              value={loginMethod}
              onValueChange={(value) => setLoginMethod(value as LoginMethod)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select login method" />
              </SelectTrigger>
              <SelectContent>
                {loginMethodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FormField
            control={form.control}
            name="accountEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="account@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Conditional Password Field - Hidden for Google/GitHub login */}
          {!shouldHidePassword && (
            <FormField
              control={form.control}
              name="accountPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter password (will be encrypted)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Stored securely with AES encryption
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {shouldHidePassword && (
            <p className="text-sm text-muted-foreground">
              Password field hidden for{" "}
              {loginMethod === "google"
                ? "Google"
                : loginMethod === "github"
                  ? "GitHub"
                  : "OAuth"}{" "}
              login
            </p>
          )}
        </div>

        {/* Notes Field */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Any additional notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : isEditMode ? (
              "Update Subscription"
            ) : (
              "Add Subscription"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
