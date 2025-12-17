"use client";

import * as React from "react";
import { CreditCard, Key, Plus, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createPaymentMethod,
  deletePaymentMethod,
  createAccountCredential,
  deleteAccountCredential,
  decryptCredentialPassword,
} from "@/actions/master-data";
import type { PaymentMethod, AccountCredential } from "@/db/master-schema";

interface ProfileClientProps {
  userId: string;
  initialPaymentMethods: PaymentMethod[];
  initialCredentials: AccountCredential[];
}

export function ProfileClient({
  userId,
  initialPaymentMethods,
  initialCredentials,
}: ProfileClientProps) {
  const [paymentMethods, setPaymentMethods] = React.useState(initialPaymentMethods);
  const [credentials, setCredentials] = React.useState(initialCredentials);
  const [isAddingPayment, setIsAddingPayment] = React.useState(false);
  const [isAddingCredential, setIsAddingCredential] = React.useState(false);

  // Payment Method Form
  const [paymentName, setPaymentName] = React.useState("");
  const [paymentProvider, setPaymentProvider] = React.useState("");
  const [paymentNumber, setPaymentNumber] = React.useState("");

  // Credential Form
  const [credName, setCredName] = React.useState("");
  const [credEmail, setCredEmail] = React.useState("");
  const [credPassword, setCredPassword] = React.useState("");

  const handleAddPaymentMethod = async () => {
    if (!paymentName || !paymentProvider) {
      toast.error("Please fill in required fields");
      return;
    }

    const result = await createPaymentMethod(userId, {
      name: paymentName,
      provider: paymentProvider,
      accountNumber: paymentNumber || undefined,
    });

    if (result.success && result.data) {
      setPaymentMethods([...paymentMethods, result.data]);
      setPaymentName("");
      setPaymentProvider("");
      setPaymentNumber("");
      setIsAddingPayment(false);
      toast.success("Payment method added");
    } else {
      toast.error(result.error || "Failed to add payment method");
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    const result = await deletePaymentMethod(userId, id);
    if (result.success) {
      setPaymentMethods(paymentMethods.filter((m) => m.id !== id));
      toast.success("Payment method deleted");
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const handleAddCredential = async () => {
    if (!credName || !credEmail) {
      toast.error("Please fill in required fields");
      return;
    }

    const result = await createAccountCredential(userId, {
      name: credName,
      email: credEmail,
      password: credPassword || undefined,
    });

    if (result.success && result.data) {
      setCredentials([...credentials, result.data]);
      setCredName("");
      setCredEmail("");
      setCredPassword("");
      setIsAddingCredential(false);
      toast.success("Account credential added");
    } else {
      toast.error(result.error || "Failed to add credential");
    }
  };

  const handleDeleteCredential = async (id: string) => {
    const result = await deleteAccountCredential(userId, id);
    if (result.success) {
      setCredentials(credentials.filter((c) => c.id !== id));
      toast.success("Credential deleted");
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const handleCopyPassword = async (id: string) => {
    const result = await decryptCredentialPassword(userId, id);
    if (result.success && result.data) {
      await navigator.clipboard.writeText(result.data);
      toast.success("Password copied to clipboard");
    } else {
      toast.error(result.error || "Failed to copy password");
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Methods Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Payment Methods</h2>
          </div>
          <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>
                  Save a payment method for quick selection when adding subscriptions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    placeholder="e.g., My BCA Card"
                    value={paymentName}
                    onChange={(e) => setPaymentName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Provider *</Label>
                  <Input
                    placeholder="e.g., BCA, GoPay, OVO"
                    value={paymentProvider}
                    onChange={(e) => setPaymentProvider(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Account Number (Optional)</Label>
                  <Input
                    placeholder="Will be masked to last 4 digits"
                    value={paymentNumber}
                    onChange={(e) => setPaymentNumber(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddPaymentMethod} className="w-full">
                  Save Payment Method
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {paymentMethods.length === 0 ? (
          <p className="text-muted-foreground text-sm">No payment methods saved yet.</p>
        ) : (
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-3 rounded-md bg-muted/50"
              >
                <div>
                  <p className="font-medium">{method.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {method.provider} {method.lastFourDigits && `• ${method.lastFourDigits}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeletePaymentMethod(method.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Credentials Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Account Credentials</h2>
          </div>
          <Dialog open={isAddingCredential} onOpenChange={setIsAddingCredential}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Account Credential</DialogTitle>
                <DialogDescription>
                  Save login credentials for quick selection when adding subscriptions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    placeholder="e.g., Personal Gmail"
                    value={credName}
                    onChange={(e) => setCredName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={credEmail}
                    onChange={(e) => setCredEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Password (Optional)</Label>
                  <Input
                    type="password"
                    placeholder="Will be encrypted"
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddCredential} className="w-full">
                  Save Credential
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {credentials.length === 0 ? (
          <p className="text-muted-foreground text-sm">No credentials saved yet.</p>
        ) : (
          <div className="space-y-2">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="flex items-center justify-between p-3 rounded-md bg-muted/50"
              >
                <div>
                  <p className="font-medium">{cred.name}</p>
                  <p className="text-sm text-muted-foreground">{cred.email}</p>
                </div>
                <div className="flex gap-1">
                  {cred.passwordEncrypted && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyPassword(cred.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCredential(cred.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
