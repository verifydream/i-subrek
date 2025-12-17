"use client";

/**
 * Password Copy Button Component
 * Decrypts password server-side and copies to clipboard without displaying
 *
 * Requirements: 4.4, 4.5
 */

import { useState } from "react";
import { Copy, Check, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { decryptSubscriptionPassword } from "@/actions/subscriptions";
import { useAuth } from "@/hooks/use-auth";

interface PasswordCopyButtonProps {
  subscriptionId: string;
  hasPassword: boolean;
}

export function PasswordCopyButton({
  subscriptionId,
  hasPassword,
}: PasswordCopyButtonProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { userId } = useAuth();

  const handleCopyPassword = async () => {
    if (!userId) {
      toast.error("You must be signed in to copy passwords");
      return;
    }

    setIsCopying(true);

    try {
      // Call server action to decrypt password
      const result = await decryptSubscriptionPassword(userId, subscriptionId);

      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to decrypt password");
        return;
      }

      // Copy to clipboard without displaying
      await navigator.clipboard.writeText(result.data);

      setIsCopied(true);
      toast.success("Password copied to clipboard");

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Error copying password:", error);
      toast.error("Failed to copy password");
    } finally {
      setIsCopying(false);
    }
  };

  if (!hasPassword) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>No password stored</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopyPassword}
      disabled={isCopying}
      className="gap-2"
    >
      {isCopying ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Copying...
        </>
      ) : isCopied ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy Password
        </>
      )}
    </Button>
  );
}
