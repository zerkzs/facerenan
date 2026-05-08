"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  Wallet,
  Users,
  ImagePlus,
  Loader2,
  TrendingUp,
  Shield,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
} from "lucide-react";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Campaign Analytics",
    description: "Real-time performance metrics and insights",
  },
  {
    icon: Wallet,
    title: "Budget Control",
    description: "Optimize spend across all campaigns",
  },
  {
    icon: Users,
    title: "Audience Targeting",
    description: "Manage segments and custom audiences",
  },
  {
    icon: ImagePlus,
    title: "Creative Management",
    description: "Upload and organize ad creatives",
  },
  {
    icon: TrendingUp,
    title: "Performance Tracking",
    description: "CPM, CPC, CTR, ROAS at a glance",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "End-to-end encrypted token storage",
  },
];

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password. Please try again.",
  OAuthSignin: "Could not start the sign-in process. Please try again.",
  OAuthCallback: "Authentication failed. Please try again.",
  AccessDenied: "Access denied.",
  default: "An unexpected error occurred. Please try again.",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default;
      toast.error("Authentication Error", { description: message });
    }
  }, [error]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          toast.error("Login failed", {
            description: "Invalid email or password.",
          });
        } else {
          router.push("/dashboard");
        }
      } else {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
          const data = await res.json();
          const message =
            typeof data.error === "string"
              ? data.error
              : "Failed to create account.";
          toast.error("Signup failed", { description: message });
        } else {
          toast.success("Account created!", {
            description: "Signing you in...",
          });

          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          if (!result?.error) {
            router.push("/dashboard");
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Hero */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 bg-[oklch(0.08_0_0)]">
          <div className="absolute -left-20 -top-20 h-[500px] w-[500px] animate-float rounded-full bg-neon/15 blur-[120px]" />
          <div className="absolute -bottom-20 -right-20 h-[400px] w-[400px] animate-float-delayed rounded-full bg-neon/10 blur-[100px]" />
          <div className="absolute left-1/3 top-1/2 h-[300px] w-[300px] animate-float-slow rounded-full bg-emerald-600/8 blur-[80px]" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon/15 border border-neon/20">
              <BarChart3 className="h-5 w-5 text-neon" />
            </div>
            <span className="font-heading text-xl font-semibold text-white">
              Meta Ads Manager
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="font-heading text-4xl font-bold leading-tight text-white xl:text-5xl">
              Manage your campaigns
              <br />
              <span className="bg-gradient-to-r from-neon to-emerald-400 bg-clip-text text-transparent">
                with precision
              </span>
            </h1>
            <p className="max-w-md text-lg text-slate-400">
              A powerful, secure dashboard for traffic managers who demand
              better control over Meta Ads.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm transition-colors hover:border-neon/20 hover:bg-white/[0.05]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <feature.icon className="mb-2 h-5 w-5 text-neon" />
                <h3 className="text-sm font-medium text-white">
                  {feature.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-slate-600">
            Secure. Encrypted. Built for professionals.
          </p>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex w-full flex-col items-center justify-center bg-[oklch(0.10_0_0)] p-8 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-12 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon/15 border border-neon/20">
            <BarChart3 className="h-5 w-5 text-neon" />
          </div>
          <span className="font-heading text-xl font-semibold text-white">
            Meta Ads Manager
          </span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="font-heading text-3xl font-bold text-white">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-slate-400">
              {isLogin
                ? "Sign in to manage your ad campaigns"
                : "Get started with Meta Ads Manager"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs text-slate-400">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required={!isLogin}
                  className="h-12 bg-white/[0.03] border-white/[0.08] text-sm focus-visible:ring-neon/30 focus-visible:border-neon/40"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-slate-400">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-12 bg-white/[0.03] border-white/[0.08] text-sm focus-visible:ring-neon/30 focus-visible:border-neon/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-slate-400">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "Your password" : "Min. 8 characters"}
                  required
                  minLength={isLogin ? undefined : 8}
                  className="h-12 pr-10 bg-white/[0.03] border-white/[0.08] text-sm focus-visible:ring-neon/30 focus-visible:border-neon/40"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full gap-3 rounded-xl bg-neon text-base font-semibold text-black transition-all hover:bg-neon-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isLogin ? (
                <LogIn className="h-5 w-5" />
              ) : (
                <UserPlus className="h-5 w-5" />
              )}
              {isLoading
                ? isLogin
                  ? "Signing in..."
                  : "Creating account..."
                : isLogin
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[oklch(0.10_0_0)] px-4 text-slate-500">
                {isLogin ? "New here?" : "Already have an account?"}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setIsLogin(!isLogin);
              setName("");
              setEmail("");
              setPassword("");
              setShowPassword(false);
            }}
            className="h-11 w-full rounded-xl border-white/[0.08] text-sm text-slate-300 hover:border-neon/30 hover:text-white"
          >
            {isLogin ? "Create an account" : "Sign in instead"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[oklch(0.08_0_0)]">
          <Loader2 className="h-8 w-8 animate-spin text-neon" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
