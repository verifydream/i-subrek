import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getPaymentMethods, getAccountCredentials, getCategoriesWithSeed } from "@/actions/master-data";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [paymentMethods, accountCredentials, categories] = await Promise.all([
    getPaymentMethods(userId),
    getAccountCredentials(userId),
    getCategoriesWithSeed(userId),
  ]);

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your master data for quick selection
        </p>
      </div>

      <SettingsClient
        userId={userId}
        initialPaymentMethods={paymentMethods}
        initialCredentials={accountCredentials}
        initialCategories={categories}
      />
    </div>
  );
}
