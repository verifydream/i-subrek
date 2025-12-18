"use client";

import * as React from "react";
import { CreditCard, Key, Plus, Trash2, Copy, Tag, Pencil } from "lucide-react";
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
  updatePaymentMethod,
  deletePaymentMethod,
  createAccountCredential,
  updateAccountCredential,
  deleteAccountCredential,
  decryptCredentialPassword,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/master-data";
import type { PaymentMethod, AccountCredential, CustomCategory } from "@/db/master-schema";

interface SettingsClientProps {
  userId: string;
  initialPaymentMethods: PaymentMethod[];
  initialCredentials: AccountCredential[];
  initialCategories: CustomCategory[];
}

export function SettingsClient({
  userId,
  initialPaymentMethods,
  initialCredentials,
  initialCategories,
}: SettingsClientProps) {
  const [paymentMethods, setPaymentMethods] = React.useState(initialPaymentMethods);
  const [credentials, setCredentials] = React.useState(initialCredentials);
  const [categories, setCategories] = React.useState(initialCategories);
  
  // Dialog states
  const [isAddingPayment, setIsAddingPayment] = React.useState(false);
  const [isAddingCredential, setIsAddingCredential] = React.useState(false);
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  
  // Edit states
  const [editingPayment, setEditingPayment] = React.useState<PaymentMethod | null>(null);
  const [editingCredential, setEditingCredential] = React.useState<AccountCredential | null>(null);
  const [editingCategory, setEditingCategory] = React.useState<CustomCategory | null>(null);

  // Payment Method Form
  const [paymentName, setPaymentName] = React.useState("");
  const [paymentProvider, setPaymentProvider] = React.useState("");
  const [paymentNumber, setPaymentNumber] = React.useState("");

  // Credential Form
  const [credName, setCredName] = React.useState("");
  const [credEmail, setCredEmail] = React.useState("");
  const [credPassword, setCredPassword] = React.useState("");

  // Category Form
  const [categoryName, setCategoryName] = React.useState("");
  const [categoryColor, setCategoryColor] = React.useState("#6366f1");

  // Reset payment form
  const resetPaymentForm = () => {
    setPaymentName("");
    setPaymentProvider("");
    setPaymentNumber("");
    setEditingPayment(null);
  };

  // Reset credential form
  const resetCredentialForm = () => {
    setCredName("");
    setCredEmail("");
    setCredPassword("");
    setEditingCredential(null);
  };

  // Reset category form
  const resetCategoryForm = () => {
    setCategoryName("");
    setCategoryColor("#6366f1");
    setEditingCategory(null);
  };

  // Open edit payment dialog
  const openEditPayment = (method: PaymentMethod) => {
    setPaymentName(method.name);
    setPaymentProvider(method.provider);
    setPaymentNumber("");
    setEditingPayment(method);
    setIsAddingPayment(true);
  };

  // Open edit credential dialog
  const openEditCredential = (cred: AccountCredential) => {
    setCredName(cred.name);
    setCredEmail(cred.email);
    setCredPassword("");
    setEditingCredential(cred);
    setIsAddingCredential(true);
  };

  // Open edit category dialog
  const openEditCategory = (cat: CustomCategory) => {
    setCategoryName(cat.name);
    setCategoryColor(cat.color || "#6366f1");
    setEditingCategory(cat);
    setIsAddingCategory(true);
  };

  // Handle payment method save (create or update)
  const handleSavePaymentMethod = async () => {
    if (!paymentName || !paymentProvider) {
      toast.error("Please fill in required fields");
      return;
    }

    if (editingPayment) {
      // Update
      const result = await updatePaymentMethod(userId, editingPayment.id, {
        name: paymentName,
        provider: paymentProvider,
        accountNumber: paymentNumber || undefined,
      });

      if (result.success && result.data) {
        setPaymentMethods(paymentMethods.map((m) => 
          m.id === editingPayment.id ? result.data! : m
        ));
        resetPaymentForm();
        setIsAddingPayment(false);
        toast.success("Payment method updated");
      } else {
        toast.error(result.error || "Failed to update");
      }
    } else {
      // Create
      const result = await createPaymentMethod(userId, {
        name: paymentName,
        provider: paymentProvider,
        accountNumber: paymentNumber || undefined,
      });

      if (result.success && result.data) {
        setPaymentMethods([...paymentMethods, result.data]);
        resetPaymentForm();
        setIsAddingPayment(false);
        toast.success("Payment method added");
      } else {
        toast.error(result.error || "Failed to add");
      }
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

  // Handle credential save (create or update)
  const handleSaveCredential = async () => {
    if (!credName || !credEmail) {
      toast.error("Please fill in required fields");
      return;
    }

    if (editingCredential) {
      // Update
      const result = await updateAccountCredential(userId, editingCredential.id, {
        name: credName,
        email: credEmail,
        password: credPassword || undefined,
      });

      if (result.success && result.data) {
        setCredentials(credentials.map((c) => 
          c.id === editingCredential.id ? result.data! : c
        ));
        resetCredentialForm();
        setIsAddingCredential(false);
        toast.success("Credential updated");
      } else {
        toast.error(result.error || "Failed to update");
      }
    } else {
      // Create
      const result = await createAccountCredential(userId, {
        name: credName,
        email: credEmail,
        password: credPassword || undefined,
      });

      if (result.success && result.data) {
        setCredentials([...credentials, result.data]);
        resetCredentialForm();
        setIsAddingCredential(false);
        toast.success("Credential added");
      } else {
        toast.error(result.error || "Failed to add");
      }
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
      toast.success("Password copied");
    } else {
      toast.error(result.error || "Failed to copy");
    }
  };

  // Handle category save (create or update)
  const handleSaveCategory = async () => {
    if (!categoryName) {
      toast.error("Please enter category name");
      return;
    }

    if (editingCategory) {
      // Update
      const result = await updateCategory(userId, editingCategory.id, {
        name: categoryName,
        color: categoryColor,
      });

      if (result.success && result.data) {
        setCategories(categories.map((c) => 
          c.id === editingCategory.id ? result.data! : c
        ));
        resetCategoryForm();
        setIsAddingCategory(false);
        toast.success("Category updated");
      } else {
        toast.error(result.error || "Failed to update");
      }
    } else {
      // Create
      const result = await createCategory(userId, {
        name: categoryName,
        color: categoryColor,
      });

      if (result.success && result.data) {
        setCategories([...categories, result.data]);
        resetCategoryForm();
        setIsAddingCategory(false);
        toast.success("Category added");
      } else {
        toast.error(result.error || "Failed to add");
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const result = await deleteCategory(userId, id);
    if (result.success) {
      setCategories(categories.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      {/* Categories Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Categories</h2>
          </div>
          <Dialog open={isAddingCategory} onOpenChange={(open) => {
            setIsAddingCategory(open);
            if (!open) resetCategoryForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? "Update category details." : "Create a custom category."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    placeholder="e.g., Gaming, Education"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={categoryColor}
                      onChange={(e) => setCategoryColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <span className="text-sm text-muted-foreground">{categoryColor}</span>
                  </div>
                </div>
                <Button onClick={handleSaveCategory} className="w-full">
                  {editingCategory ? "Update Category" : "Save Category"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Default Categories:</p>
          <div className="flex flex-wrap gap-2">
            {["General", "Entertainment", "Tools", "Work", "Utilities"].map((cat) => (
              <span key={cat} className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-muted">
                {cat}
              </span>
            ))}
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">No custom categories yet.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">Custom Categories:</p>
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color || "#6366f1" }} />
                  <span className="font-medium">{cat.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditCategory(cat)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Methods Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Payment Methods</h2>
          </div>
          <Dialog open={isAddingPayment} onOpenChange={(open) => {
            setIsAddingPayment(open);
            if (!open) resetPaymentForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPayment ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
                <DialogDescription>
                  {editingPayment ? "Update payment method details." : "Save a payment method for quick selection."}
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
                  <Label>Account Number {editingPayment ? "(leave empty to keep current)" : "(Optional)"}</Label>
                  <Input
                    placeholder="Will be masked to last 4 digits"
                    value={paymentNumber}
                    onChange={(e) => setPaymentNumber(e.target.value)}
                  />
                </div>
                <Button onClick={handleSavePaymentMethod} className="w-full">
                  {editingPayment ? "Update Payment Method" : "Save Payment Method"}
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
              <div key={method.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">{method.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {method.provider} {method.lastFourDigits && `• ****${method.lastFourDigits}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditPayment(method)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeletePaymentMethod(method.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
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
          <Dialog open={isAddingCredential} onOpenChange={(open) => {
            setIsAddingCredential(open);
            if (!open) resetCredentialForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCredential ? "Edit Credential" : "Add Credential"}</DialogTitle>
                <DialogDescription>
                  {editingCredential ? "Update credential details." : "Save login credentials for quick selection."}
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
                  <Label>Password {editingCredential ? "(leave empty to keep current)" : "(Optional)"}</Label>
                  <Input
                    type="password"
                    placeholder="Will be encrypted"
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveCredential} className="w-full">
                  {editingCredential ? "Update Credential" : "Save Credential"}
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
              <div key={cred.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">{cred.name}</p>
                  <p className="text-sm text-muted-foreground">{cred.email}</p>
                </div>
                <div className="flex gap-1">
                  {cred.passwordEncrypted && (
                    <Button variant="ghost" size="icon" onClick={() => handleCopyPassword(cred.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEditCredential(cred)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCredential(cred.id)}>
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
