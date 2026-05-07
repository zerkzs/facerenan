"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Wallet,
  Users,
  ImagePlus,
  Loader2,
  TrendingUp,
  Shield,
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
  OAuthSignin: "Could not start the sign-in process. Please try again.",
  OAuthCallback: "Authentication failed. Please try again.",
  OAuthAccountNotLinked:
    "This account is already linked to another sign-in method.",
  AccessDenied:
    "Access denied. Please grant the required permissions to continue.",
  default: "An unexpected error occurred. Please try again.",
};

function MetaIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a4.892 4.892 0 0 0 1.12 2.15c.55.586 1.3.928 2.196.928 1.037 0 1.952-.395 2.853-1.146a15.58 15.58 0 0 0 2.39-2.986c.405-.623.783-1.27 1.134-1.928.373.698.78 1.39 1.23 2.064.8 1.2 1.715 2.264 2.707 2.978.88.633 1.792.968 2.747.968.9 0 1.652-.342 2.204-.93a4.895 4.895 0 0 0 1.12-2.152c.14-.608.21-1.27.21-1.973 0-2.566-.706-5.24-2.047-7.306C16.769 5.31 15.053 4.03 13.085 4.03c-1.2 0-2.22.498-3.073 1.382C9.163 4.528 8.133 4.03 6.915 4.03ZM4.8 13.186c.546-1.387 1.322-2.616 2.08-3.14.39-.27.738-.376 1.057-.376.36 0 .727.17 1.112.51.453.4.906.997 1.333 1.744-.397.66-.81 1.293-1.238 1.876-.796 1.082-1.61 1.927-2.322 2.386-.462.297-.854.417-1.183.417-.395 0-.7-.16-.95-.437-.282-.313-.482-.798-.595-1.4a6.158 6.158 0 0 1-.1-1.18c0-.461.027-.935.082-1.4h-.276Zm10.497.058c-.56-1.418-1.353-2.674-2.125-3.202-.396-.272-.746-.378-1.066-.378-.357 0-.72.168-1.103.505-.454.399-.91.998-1.339 1.747.404.666.824 1.305 1.26 1.893.804 1.086 1.625 1.933 2.342 2.394.463.298.856.418 1.185.418.396 0 .7-.16.95-.438.283-.314.483-.8.596-1.403.065-.347.1-.716.1-1.106 0-.466-.028-.944-.083-1.413h.283v-.017Z" />
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      const message =
        ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default;
      toast.error("Authentication Error", { description: message });
    }
  }, [error]);

  function handleSignIn() {
    setIsLoading(true);
    signIn("facebook", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Hero */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 bg-slate-950">
          <div className="absolute -left-20 -top-20 h-[500px] w-[500px] animate-float rounded-full bg-[#1877F2]/20 blur-[120px]" />
          <div className="absolute -bottom-20 -right-20 h-[400px] w-[400px] animate-float-delayed rounded-full bg-[#1877F2]/15 blur-[100px]" />
          <div className="absolute left-1/3 top-1/2 h-[300px] w-[300px] animate-float-slow rounded-full bg-indigo-600/10 blur-[80px]" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2]">
              <MetaIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-xl font-semibold text-white">
              Meta Ads Dashboard
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="font-heading text-4xl font-bold leading-tight text-white xl:text-5xl">
              Manage your campaigns
              <br />
              <span className="bg-gradient-to-r from-[#1877F2] to-indigo-400 bg-clip-text text-transparent">
                with precision
              </span>
            </h1>
            <p className="max-w-md text-lg text-slate-400">
              A powerful, secure alternative to Meta&apos;s native Ads Manager.
              Built for traffic managers who demand better.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm transition-colors hover:border-[#1877F2]/20 hover:bg-white/[0.05]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <feature.icon className="mb-2 h-5 w-5 text-[#1877F2]" />
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
            Secure. Open source. Free to use.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex w-full flex-col items-center justify-center bg-slate-950 p-8 lg:w-1/2 lg:bg-slate-900/50">
        {/* Mobile logo */}
        <div className="mb-12 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2]">
            <MetaIcon className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading text-xl font-semibold text-white">
            Meta Ads Dashboard
          </span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="font-heading text-3xl font-bold text-white">
              Welcome back
            </h2>
            <p className="text-slate-400">
              Sign in to manage your ad campaigns
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              className="h-12 w-full gap-3 rounded-xl bg-[#1877F2] text-base font-medium text-white transition-all hover:bg-[#1668d9] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MetaIcon className="h-5 w-5" />
              )}
              {isLoading ? "Connecting..." : "Continue with Meta"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-950 px-4 text-slate-500 lg:bg-slate-900/50">
                  Secure OAuth 2.0 authentication
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <h3 className="text-sm font-medium text-slate-300">
              Required permissions
            </h3>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#1877F2]" />
                Ads Management — create, edit, and pause campaigns
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#1877F2]" />
                Ads Read — view performance metrics and insights
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#1877F2]" />
                Business Management — access ad accounts and pages
              </li>
            </ul>
          </div>

          <p className="text-center text-xs text-slate-600">
            By signing in, you agree to our{" "}
            <span className="text-slate-400 underline underline-offset-2">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-slate-400 underline underline-offset-2">
              Privacy Policy
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
