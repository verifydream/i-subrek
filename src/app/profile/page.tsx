import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, User, Mail, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

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
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Your account information
        </p>
      </div>

      {/* User Info Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="Profile"
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-semibold">
              {user?.fullName || user?.firstName || "User"}
            </h2>
            <p className="text-muted-foreground">Member</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">
                {user?.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
