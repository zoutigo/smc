import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = (await getServerSession(authOptions)) as (Session & {
    user?: {
      name?: string | null;
      email?: string | null;
    };
  }) | null;
  if (!session) redirect("/auth/login");

  const fullName = session.user?.name ?? "";
  const parts = fullName.split(" ").filter(Boolean);
  const firstName = parts.shift() ?? "";
  const lastName = parts.join(" ") || "";

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">First name</div>
              <div className="mt-1 text-lg font-medium">{firstName || "—"}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Last name</div>
              <div className="mt-1 text-lg font-medium">{lastName || "—"}</div>
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="mt-1 text-lg font-medium">{session.user?.email ?? "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
