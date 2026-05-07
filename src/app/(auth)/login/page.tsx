import { redirect } from "next/navigation";
import { auth } from "@/features/auth/infrastructure/next-auth-config";
import { LoginPage } from "@/features/auth/presentation/login-page";

export default async function Login() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return <LoginPage />;
}
