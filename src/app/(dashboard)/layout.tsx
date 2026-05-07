import { redirect } from "next/navigation";
import { auth } from "@/features/auth/infrastructure/next-auth-config";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
