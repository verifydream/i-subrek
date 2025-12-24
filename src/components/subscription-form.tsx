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
import { 
  Loader2, 
  CreditCard, 
  User, 
  Link as LinkIcon,
  Mail,
  Chrome,
  Github,
  KeyRound,
  Wallet,
  Building2,
  Smartphone
} from "lucide-react";

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

  // Set initial values from subscription (edit mode)
  React.useEffect(() => {
    if (subscription) {
      // Set category
      if (subscription.category) {
        setSelectedCategory(subscription.category);
      }
      // Set login method from subscription
      if ((subscription as any).accountLoginMethod) {
        // Check if it matches a credential name
        const matchingCred = accountCredentials.find(
          c => c.name.toLowerCase() === (subscription as any).accountLoginMethod?.toLowerCase() &&
               c.email === subscription.accountEmail
        );
        if (matchingCred) {
          setUseCredentialMaster(true);
          setSelectedCredentialId(matchingCred.id);
        } else {
          // Set manual login method
          const method = (subscription as any).accountLoginMethod?.toLowerCase();
          if (method?.includes("google")) setLoginMethod("google");
          else if (method?.includes("github")) setLoginMethod("github");
          else if (method?.includes("email")) setLoginMethod("email");
          else setLoginMethod("other");
        }
      }
      // Set dates from subscription
      if (subscription.startDate) {
        const start = new Date(subscription.startDate);
        setStartDate(start);
        setStartDateForDays(start);
      }
      if (subscription.nextPaymentDate) {
        const end = new Date(subscription.nextPaymentDate);
        setEndDate(end);
        // Calculate duration
        const start = subscription.startDate ? new Date(subscription.startDate) : new Date();
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        setDurationDays(days > 0 ? days : 30);
      }
    }
  }, [subscription]);

  const form = useForm<CreateSubscriptionFormInput>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      name: subscription?.name ?? "",
      price: subscription?.price ? parseFloat(subscription.price) : 1000, // Default 1000 for IDR
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

  // Update default price when currency changes
  React.useEffect(() => {
    const currentPrice = form.getValues("price");
    // Only set default if price is empty or is the default value
    if (!currentPrice || currentPrice === 1000 || currentPrice === 1) {
      form.setValue("price", watchedCurrency === "IDR" ? 1000 : 1);
    }
  }, [watchedCurrency, form]);

  // Handle form submission
  const handleSubmit = async (data: CreateSubscriptionFormInput) => {
    try {
      // Set the correct start date and end date based on mode
      if (dateInputMode === "date") {
        data.startDate = startDate;
        // Use the selected end date directly as nextPaymentDate
        (data as any).nextPaymentDate = endDate;
      } else {
        data.startDate = startDateForDays;
        // Calculate end date from duration days
        (data as any).nextPaymentDate = addDays(startDateForDays, durationDays);
      }
      
      // Set category
      if (selectedCategory && selectedCategory !== "General") {
        data.category = selectedCategory as any;
      }
      
      // Set login method from selected credential or manual input
      if (useCredentialMaster && selectedCredentialId) {
        const selectedCred = accountCredentials.find(c => c.id === selectedCredentialId);
        if (selectedCred) {
          (data as any).accountLoginMethod = selectedCred.name; // Use credential name as login method
        }
      } else {
        (data as any).accountLoginMethod = loginMethod;
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
        <div className="space-y-4 rounded-lg border p-4 bg-gradient-to-br from-blue-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <Wallet className="h-4 w-4 text-blue-500" />
              </div>
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
            <div className="space-y-3">
              {/* Group payment methods by name (GoPay, BCA, etc) */}
              {Object.entries(
                paymentMethods.reduce((groups, method) => {
                  const name = method.name || "Other";
                  if (!groups[name]) groups[name] = [];
                  groups[name].push(method);
                  return groups;
                }, {} as Record<string, typeof paymentMethods>)
              ).map(([name, methods]) => (
                <div key={name} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {name.toLowerCase().includes("gopay") || name.toLowerCase().includes("ovo") || name.toLowerCase().includes("dana") || name.toLowerCase().includes("shopeepay") ? (
                      <Smartphone className="h-3.5 w-3.5" />
                    ) : name.toLowerCase().includes("bca") || name.toLowerCase().includes("bni") || name.toLowerCase().includes("mandiri") || name.toLowerCase().includes("bri") || name.toLowerCase().includes("bank") ? (
                      <Building2 className="h-3.5 w-3.5" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5" />
                    )}
                    {name}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {methods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setSelectedPaymentId(method.id);
                          form.setValue("paymentMethodProvider", method.provider);
                        }}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all",
                          selectedPaymentId === method.id
                            ? "border-blue-500 bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500"
                            : "border-muted hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        )}
                      >
                        {name.toLowerCase().includes("gopay") || name.toLowerCase().includes("ovo") || name.toLowerCase().includes("dana") || name.toLowerCase().includes("shopeepay") ? (
                          <Smartphone className="h-4 w-4 text-blue-500 shrink-0" />
                        ) : name.toLowerCase().includes("bca") || name.toLowerCase().includes("bni") || name.toLowerCase().includes("mandiri") || name.toLowerCase().includes("bri") || name.toLowerCase().includes("bank") ? (
                          <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-blue-500 shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-xs font-medium">{method.provider}</span>
                          {method.lastFourDigits && (
                            <span className="text-[10px] text-muted-foreground font-mono">****{method.lastFourDigits}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {selectedPaymentId && (
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 rounded-md p-2 flex items-center gap-2">
                  <CreditCard className="h-3 w-3" />
                  Selected: {paymentMethods.find(p => p.id === selectedPaymentId)?.name} - {paymentMethods.find(p => p.id === selectedPaymentId)?.provider}
                </div>
              )}
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
        <div className="space-y-4 rounded-lg border p-4 bg-gradient-to-br from-violet-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-violet-500/10">
                <KeyRound className="h-4 w-4 text-violet-500" />
              </div>
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
            <div className="space-y-3">
              {/* Group credentials by name (Google, Email, etc) */}
              {Object.entries(
                accountCredentials.reduce((groups, cred) => {
                  const name = cred.name || "Other";
                  if (!groups[name]) groups[name] = [];
                  groups[name].push(cred);
                  return groups;
                }, {} as Record<string, typeof accountCredentials>)
              ).map(([name, creds]) => (
                <div key={name} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400">
                    {name.toLowerCase().includes("google") ? (
                      <Chrome className="h-3.5 w-3.5" />
                    ) : name.toLowerCase().includes("github") ? (
                      <Github className="h-3.5 w-3.5" />
                    ) : name.toLowerCase().includes("email") ? (
                      <Mail className="h-3.5 w-3.5" />
                    ) : (
                      <KeyRound className="h-3.5 w-3.5" />
                    )}
                    {name}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {creds.map((cred) => (
                      <button
                        key={cred.id}
                        type="button"
                        onClick={() => {
                          setSelectedCredentialId(cred.id);
                          form.setValue("accountEmail", cred.email);
                          setLoginMethod((cred.loginMethod as LoginMethod) || "email");
                        }}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all",
                          selectedCredentialId === cred.id
                            ? "border-violet-500 bg-violet-100 dark:bg-violet-900/30 ring-1 ring-violet-500"
                            : "border-muted hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/20"
                        )}
                      >
                        {name.toLowerCase().includes("google") ? (
                          <Chrome className="h-4 w-4 text-violet-500 shrink-0" />
                        ) : name.toLowerCase().includes("github") ? (
                          <Github className="h-4 w-4 text-violet-500 shrink-0" />
                        ) : name.toLowerCase().includes("email") ? (
                          <Mail className="h-4 w-4 text-violet-500 shrink-0" />
                        ) : (
                          <User className="h-4 w-4 text-violet-500 shrink-0" />
                        )}
                        <span className="truncate text-xs">{cred.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {selectedCredentialId && (
                <div className="text-xs text-muted-foreground bg-violet-50 dark:bg-violet-950/30 rounded-md p-2 flex items-center gap-2">
                  <User className="h-3 w-3" />
                  Selected: {accountCredentials.find(c => c.id === selectedCredentialId)?.email}
                </div>
              )}
            </div>
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
