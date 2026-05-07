import { redirect } from "next/navigation";
import { auth } from "@/features/auth/infrastructure/next-auth-config";

export default async function Home() {
  const session = await auth();
  redirect(session?.user?.id ? "/dashboard" : "/login");
}
