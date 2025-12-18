"use client";

/**
 * Subscription Form Component
 * Create/edit form with React Hook Form and Zod validation
 * Supports master data selection for payment methods, credentials, and categories
 */

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays } from "date-fns";
import { Loader2, CreditCard, User, Link as LinkIcon } from "lucide-react";

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
  currencyValues,
  type CreateSubscriptionInput,
  type CreateSubscriptionFormInput,
} from "@/lib/validations";
import type { Subscription } from "@/db/schema";
import type { PaymentMethod, AccountCredential, CustomCategory } from "@/db/master-schema";
import { cn } from "@/lib/utils";



// Login method options
const loginMethodOptions = [
  { value: "email", label: "Email/Password" },
  { value: "google", label: "Google" },
  { value: "github", label: "GitHub" },
  { value: "other", label: "Other OAuth" },
] as const;

type LoginMethod = (typeof loginMethodOptions)[number]["value"];

interface SubscriptionFormProps {
  subscription?: Subscription;
  onSuccess: () => void;
  onCancel: () => void;
  onSubmit: (data: CreateSubscriptionInput) => Promise<void>;
  isSubmitting?: boolean;
  paymentMethods?: PaymentMethod[];
  accountCredentials?: AccountCredential[];
  categories?: CustomCategory[];
}

export function SubscriptionForm({
  subscription,
  onSuccess,
  onCancel,
  onSubmit,
  isSubmitting = false,
  paymentMethods = [],
  accountCredentials = [],
  categories = [],
}: SubscriptionFormProps) {
  const isEditMode = !!subscription;

  // Categories from master data
  const allCategories = categories.map((c) => ({ name: c.name, color: c.color || "#6366f1" }));

  // State
  const [loginMethod, setLoginMethod] = React.useState<LoginMethod>("email");
  const [usePaymentMaster, setUsePaymentMaster] = React.useState(false);
  const [useCredentialMaster, setUseCredentialMaster] = React.useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = React.useState<string>("");
  const [selectedCredentialId, setSelectedCredentialId] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("General");
  
  // Date input mode
  const [dateInputMode, setDateInputMode] = React.useState<"date" | "days">("date");
  const [startDate, setStartDate] = React.useState<Date>(new Date());
  const [endDate, setEndDate] = React.useState<Date>(addDays(new Date(), 30));
  const [durationDays, setDurationDays] = React.useState<number>(30);
  const [startDateForDays, setStartDateForDays] = React.useState<Date>(new Date());

  // Update master data mode when data is loaded
  React.useEffect(() => {
    if (paymentMethods.length > 0 && !isEditMode) {
      setUsePaymentMaster(true);
    }
  }, [paymentMethods.length, isEditMode]);

  React.useEffect(() => {
    if (accountCredentials.length > 0 && !isEditMode) {
      setUseCredentialMaster(true);
    }
  }, [accountCredentials.length, isEditMode]);

  // Set initial category from subscription
  React.useEffect(() => {
    if (subscription?.category) {
      setSelectedCategory(subscription.category);
    }
  }, [subscription?.category]);

  const form = useForm<CreateSubscriptionFormInput>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      name: subscription?.name ?? "",
      price: subscription?.price ? parseFloat(subscription.price) : undefined,
      currency: (subscription?.currency as "IDR" | "USD") ?? "IDR",
      billingCycle: "monthly", // Will be calculated from dates
      startDate: subscription?.startDate ? new Date(subscription.startDate) : new Date(),
      reminderDays: subscription?.reminderDays ?? 3,
      paymentMethodProvider: subscription?.paymentMethodProvider ?? "",
      paymentMethodNumber: "",
      accountEmail: subscription?.accountEmail ?? "",
      accountPassword: "",
      notes: subscription?.notes ?? "",
      category: subscription?.category ?? undefined,
      url: (subscription as any)?.url ?? "",
    },
  });

  const watchedCurrency = form.watch("currency");

  // Handle form submission
  const handleSubmit = async (data: CreateSubscriptionFormInput) => {
    try {
      // Set the correct start date based on mode
      if (dateInputMode === "date") {
        data.startDate = startDate;
      } else {
        data.startDate = startDateForDays;
      }
      
      // Set category
      if (selectedCategory && selectedCategory !== "General") {
        data.category = selectedCategory as any;
      }
      
      await onSubmit(data as CreateSubscriptionInput);
      onSuccess();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const shouldHidePassword =
    loginMethod === "google" || loginMethod === "github" || loginMethod === "other";

  // Price step based on currency
  const priceStep = watchedCurrency === "IDR" ? 1000 : 0.01;

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

        {/* URL Field (Optional) */}
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Subscription URL (Optional)
              </FormLabel>
              <FormControl>
                <Input placeholder="https://netflix.com" {...field} />
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
                    step={priceStep}
                    min="0"
                    placeholder={watchedCurrency === "IDR" ? "50000" : "9.99"}
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        {/* Date Input Section */}
        <div className="space-y-4 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Subscription Period</h3>
            <div className="flex gap-1">
              <Button
                type="button"
                variant={dateInputMode === "date" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateInputMode("date")}
              >
                Pilih Tanggal
              </Button>
              <Button
                type="button"
                variant={dateInputMode === "days" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateInputMode("days")}
              >
                Input Hari
              </Button>
            </div>
          </div>

          {dateInputMode === "date" ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <DatePicker
                  date={startDate}
                  onDateChange={(d) => d && setStartDate(d)}
                  placeholder="Pilih tanggal mulai"
                />
                <p className="text-xs text-muted-foreground mt-1">Default: hari ini</p>
              </div>
              <div>
                <label className="text-sm font-medium">End Date (Expired)</label>
                <DatePicker
                  date={endDate}
                  onDateChange={(d) => d && setEndDate(d)}
                  placeholder="Pilih tanggal berakhir"
                />
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  Durasi: <span className="font-medium text-foreground">
                    {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} hari
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <DatePicker
                  date={startDateForDays}
                  onDateChange={(d) => d && setStartDateForDays(d)}
                  placeholder="Pilih tanggal mulai"
                />
                <p className="text-xs text-muted-foreground mt-1">Default: hari ini</p>
              </div>
              <div>
                <label className="text-sm font-medium">Durasi Langganan (hari)</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                  placeholder="e.g., 30"
                />
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  End date: <span className="font-medium text-foreground">
                    {format(addDays(startDateForDays, durationDays), "PPP")}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reminder Days */}
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
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>Days before payment to highlight</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Grid */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {allCategories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md border text-sm transition-all",
                  selectedCategory === cat.name
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-muted hover:border-primary/50"
                )}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="space-y-4 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Method (Optional)
            </h3>
            {paymentMethods.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUsePaymentMaster(!usePaymentMaster);
                  if (usePaymentMaster) {
                    form.setValue("paymentMethodProvider", "");
                    form.setValue("paymentMethodNumber", "");
                  }
                  setSelectedPaymentId("");
                }}
              >
                {usePaymentMaster ? "Input Custom" : "Pilih Tersimpan"}
              </Button>
            )}
          </div>

          {usePaymentMaster && paymentMethods.length > 0 ? (
            <div className="space-y-2">
              <Select
                value={selectedPaymentId}
                onValueChange={(value) => {
                  setSelectedPaymentId(value);
                  const selected = paymentMethods.find((p) => p.id === value);
                  if (selected) {
                    form.setValue("paymentMethodProvider", selected.provider);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name} - {method.provider}
                      {method.lastFourDigits && ` (****${method.lastFourDigits})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <FormField
                control={form.control}
                name="paymentMethodProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="GoPay, BCA, etc." {...field} />
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
                      <Input placeholder="Will be masked" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        {/* Account Credentials Section */}
        <div className="space-y-4 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Account Credentials (Optional)
            </h3>
            {accountCredentials.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUseCredentialMaster(!useCredentialMaster);
                  if (useCredentialMaster) {
                    form.setValue("accountEmail", "");
                    form.setValue("accountPassword", "");
                  }
                  setSelectedCredentialId("");
                }}
              >
                {useCredentialMaster ? "Input Custom" : "Pilih Tersimpan"}
              </Button>
            )}
          </div>

          {useCredentialMaster && accountCredentials.length > 0 ? (
            <Select
              value={selectedCredentialId}
              onValueChange={(value) => {
                setSelectedCredentialId(value);
                const selected = accountCredentials.find((c) => c.id === value);
                if (selected) {
                  form.setValue("accountEmail", selected.email);
                  setLoginMethod((selected.loginMethod as LoginMethod) || "email");
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih credential" />
              </SelectTrigger>
              <SelectContent>
                {accountCredentials.map((cred) => (
                  <SelectItem key={cred.id} value={cred.id}>
                    {cred.name} - {cred.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Login Method</label>
                <Select
                  value={loginMethod}
                  onValueChange={(value) => setLoginMethod(value as LoginMethod)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {loginMethodOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="account@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!shouldHidePassword && (
                <FormField
                  control={form.control}
                  name="accountPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Will be encrypted" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Any notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : isEditMode ? (
              "Update"
            ) : (
              "Add Subscription"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
