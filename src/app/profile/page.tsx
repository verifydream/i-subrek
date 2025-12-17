import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreditCard, Key, Plus, Trash2 } from "lucide-react";

import { getPaymentMethods, getAccountCredentials } from "@/actions/master-data";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  const [paymentMethods, accountCredentials] = await Promise.all([
    getPaymentMethods(userId),
    getAccountCredentials(userId),
  ]);

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile & Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and master data
        </p>
      </div>

      {/* User Info */}
      <div className="rounded-lg border bg-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-2">
          <p>
            <span className="text-muted-foreground">Name:</span>{" "}
            <span className="font-medium">{user?.fullName || user?.firstName || "N/A"}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
          </p>
        </div>
      </div>

      <ProfileClient
        userId={userId}
        initialPaymentMethods={paymentMethods}
        initialCredentials={accountCredentials}
      />
    </div>
  );
}
