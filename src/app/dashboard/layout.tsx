import { redirect } from "next/navigation";
import { auth } from "@/features/auth/infrastructure/next-auth-config";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <>{children}</>;
}
