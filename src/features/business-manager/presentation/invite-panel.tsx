"use client";

import { useState, useCallback } from "react";
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { BusinessManager } from "../domain/entities";
import type { BusinessUserRole, InviteResult } from "../domain/value-objects";

const INVITE_DELAY_MS = 3000;

interface InvitePanelProps {
  businessManagers: BusinessManager[];
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const STATUS_ICON = {
  success: <CheckCircle2 className="h-4 w-4 text-neon shrink-0" />,
  already_member: (
    <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
  ),
  error: <XCircle className="h-4 w-4 text-red-400 shrink-0" />,
} as const;

const STATUS_TEXT_CLASS = {
  success: "text-neon",
  already_member: "text-yellow-400",
  error: "text-red-400",
} as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function InvitePanel({ businessManagers }: InvitePanelProps) {
  const [selectedBmId, setSelectedBmId] = useState<string>("");
  const [emailsRaw, setEmailsRaw] = useState("");
  const [role, setRole] = useState<BusinessUserRole>("EMPLOYEE");

  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [isDone, setIsDone] = useState(false);

  const emails = parseEmails(emailsRaw);
  const invalidEmails = emails.filter((e) => !validateEmail(e));
  const validEmails = emails.filter(validateEmail);
  const hasValidInput =
    selectedBmId && validEmails.length > 0 && invalidEmails.length === 0;

  const reset = useCallback(() => {
    setSelectedBmId("");
    setEmailsRaw("");
    setRole("EMPLOYEE");
    setIsSending(false);
    setProgress(0);
    setTotalCount(0);
    setResults([]);
    setIsDone(false);
  }, []);

  async function handleSend() {
    if (!hasValidInput) return;

    setIsSending(true);
    setProgress(0);
    setTotalCount(validEmails.length);
    setResults([]);
    setIsDone(false);

    for (let i = 0; i < validEmails.length; i++) {
      try {
        const res = await fetch(
          `/api/business-managers/${selectedBmId}/invite`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: validEmails[i], role }),
          }
        );

        if (!res.ok) {
          const err = await res.json();
          setResults((prev) => [
            ...prev,
            {
              email: validEmails[i],
              status: "error",
              message: err.error ?? `HTTP ${res.status}`,
            },
          ]);
        } else {
          const result: InviteResult = await res.json();
          setResults((prev) => [...prev, result]);
        }
      } catch {
        setResults((prev) => [
          ...prev,
          {
            email: validEmails[i],
            status: "error" as const,
            message: "Network error",
          },
        ]);
      }

      setProgress(i + 1);

      if (i < validEmails.length - 1) {
        await delay(INVITE_DELAY_MS);
      }
    }

    setIsSending(false);
    setIsDone(true);
  }

  const selectedBm = businessManagers.find((b) => b.id === selectedBmId);
  const progressPercent =
    totalCount > 0 ? Math.round((progress / totalCount) * 100) : 0;
  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const alreadyCount = results.filter(
    (r) => r.status === "already_member"
  ).length;

  if (businessManagers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] mb-4">
          <Users className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
          No Business Managers
        </h2>
        <p className="text-sm text-muted-foreground">
          Add a Business Manager first to invite people
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Invite Members
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add people to your Business Managers as Employee or Admin
        </p>
      </div>

      <div className="max-w-2xl">
        {isSending || isDone ? (
          <div className="space-y-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isSending
                    ? `Sending invites... (${progress}/${totalCount})`
                    : "Complete"}
                </span>
                <span className="font-mono text-foreground">
                  {progressPercent}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {isDone && (
              <div className="flex gap-4 text-sm">
                {successCount > 0 && (
                  <span className="flex items-center gap-1.5 text-neon">
                    <CheckCircle2 className="h-4 w-4" />
                    {successCount} sent
                  </span>
                )}
                {alreadyCount > 0 && (
                  <span className="flex items-center gap-1.5 text-yellow-400">
                    <AlertTriangle className="h-4 w-4" />
                    {alreadyCount} already member
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="flex items-center gap-1.5 text-red-400">
                    <XCircle className="h-4 w-4" />
                    {errorCount} failed
                  </span>
                )}
              </div>
            )}

            <div className="max-h-72 overflow-y-auto space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {STATUS_ICON[r.status]}
                  <span className="text-foreground truncate min-w-0 flex-1">
                    {r.email}
                  </span>
                  <span className={`shrink-0 ${STATUS_TEXT_CLASS[r.status]}`}>
                    {r.message}
                  </span>
                </div>
              ))}
              {isSending &&
                validEmails.slice(progress).map((email, i) => (
                  <div
                    key={`pending-${i}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground/50"
                  >
                    <div className="h-4 w-4 shrink-0" />
                    <span className="truncate">{email}</span>
                    <span className="shrink-0">Pending</span>
                  </div>
                ))}
            </div>

            {isDone && (
              <Button
                onClick={reset}
                className="bg-neon text-black font-medium hover:bg-neon-hover"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Send More
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Business Manager <span className="text-neon">*</span>
              </Label>
              <Select
                value={selectedBmId}
                onValueChange={(v) => setSelectedBmId(v ?? "")}
              >
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] focus:ring-neon/30 focus:border-neon/40">
                  <SelectValue placeholder="Select a Business Manager" />
                </SelectTrigger>
                <SelectContent className="bg-[oklch(0.18_0_0)] border-white/[0.08]">
                  {businessManagers.map((bm) => (
                    <SelectItem key={bm.id} value={bm.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{bm.bmName ?? bm.bmId}</span>
                        {bm.bmName && (
                          <span className="text-muted-foreground text-[10px]">
                            ({bm.bmId})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBm?.status === "expired" && (
                <p className="text-xs text-yellow-400">
                  This BM&apos;s token is expired. Renew it before inviting.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Role <span className="text-neon">*</span>
              </Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  if (v) setRole(v as BusinessUserRole);
                }}
              >
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] focus:ring-neon/30 focus:border-neon/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[oklch(0.18_0_0)] border-white/[0.08]">
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">
                  Emails <span className="text-neon">*</span>
                </Label>
                {validEmails.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {validEmails.length}{" "}
                    {validEmails.length === 1 ? "email" : "emails"}
                  </span>
                )}
              </div>
              <Textarea
                value={emailsRaw}
                onChange={(e) => setEmailsRaw(e.target.value)}
                placeholder={
                  "person@example.com\nanother@example.com\none-more@example.com"
                }
                rows={6}
                className="bg-white/[0.03] border-white/[0.08] text-sm focus-visible:ring-neon/30 focus-visible:border-neon/40 resize-none font-mono"
              />
              <p className="text-xs text-muted-foreground">
                One email per line. You can also separate with commas.
              </p>
              {invalidEmails.length > 0 && (
                <p className="text-xs text-red-400">
                  Invalid:{" "}
                  {invalidEmails.slice(0, 3).join(", ")}
                  {invalidEmails.length > 3 &&
                    ` +${invalidEmails.length - 3} more`}
                </p>
              )}
            </div>

            <Button
              onClick={handleSend}
              disabled={!hasValidInput}
              className="bg-neon text-black font-medium hover:bg-neon-hover"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {validEmails.length <= 1
                ? "Send Invite"
                : `Send ${validEmails.length} Invites`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
