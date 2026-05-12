"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, ExternalLink, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { AdAccount, AdAccountStatus } from "../domain/entities";

interface AdAccountCardProps {
  account: AdAccount;
}

const STATUS_DOT_CLASS: Record<AdAccountStatus, string> = {
  active: "bg-neon",
  restricted: "bg-red-400",
  paused: "bg-yellow-400",
  closed: "bg-zinc-500",
};

const STATUS_BADGE: Record<
  AdAccountStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Ativa",
    className: "bg-neon/15 text-neon border-neon/30",
  },
  restricted: {
    label: "Restrita",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  paused: {
    label: "Pausada",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  closed: {
    label: "Fechada",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
};

function formatCurrency(value: string | null, currency: string): string {
  if (!value) return "\u2014";
  const num = parseFloat(value);
  if (isNaN(num)) return "\u2014";
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
}

function formatPaymentMethod(
  details: AdAccount["fundingSourceDetails"]
): string {
  if (!details?.displayString) return "\u2014";
  return details.displayString;
}

function RowMenu({ accountId }: { accountId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const actId = accountId.startsWith("act_")
    ? accountId
    : `act_${accountId}`;

  function handleCopyId() {
    navigator.clipboard.writeText(actId);
    toast.success("ID copied", { description: actId });
    setIsOpen(false);
  }

  function handleOpenMeta() {
    window.open(
      `https://business.facebook.com/adsmanager/manage/campaigns?act=${accountId}`,
      "_blank"
    );
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-white/[0.08] bg-[oklch(0.17_0_0)] p-1 shadow-xl">
          <button
            onClick={handleCopyId}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-white/[0.06]"
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            Copiar ID
          </button>
          <button
            onClick={handleOpenMeta}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-white/[0.06]"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            Abrir no Meta
          </button>
        </div>
      )}
    </div>
  );
}

function DataColumn({
  label,
  value,
  isMono,
}: {
  label: string;
  value: string;
  isMono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-0.5">
        {label}
      </p>
      <p
        className={`text-xs truncate ${isMono ? "font-mono" : ""} ${value === "\u2014" ? "text-muted-foreground/40" : "text-foreground/70"}`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export function AdAccountCard({ account }: AdAccountCardProps) {
  const statusBadge = STATUS_BADGE[account.status];
  const actId = `act_${account.accountId}`;

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all hover:border-neon/20 hover:bg-white/[0.04]">
      {/* Status dot */}
      <div
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT_CLASS[account.status]}`}
      />

      {/* Name + ID */}
      <div className="min-w-0 w-44 shrink-0">
        <p className="truncate font-heading text-sm font-semibold text-foreground">
          {account.name}
        </p>
        <p className="truncate text-[11px] font-mono text-muted-foreground">
          {actId}
        </p>
      </div>

      {/* Data columns — hidden on mobile */}
      <div className="hidden lg:grid flex-1 grid-cols-4 gap-4 min-w-0">
        <DataColumn
          label="Pagamento"
          value={formatPaymentMethod(account.fundingSourceDetails)}
        />
        <DataColumn
          label="Ad Spend Limit"
          value={formatCurrency(account.spendCap, account.currency)}
        />
        <DataColumn
          label="Gasto Hoje"
          value={formatCurrency(account.spendToday, account.currency)}
          isMono
        />
        <DataColumn
          label="Gasto Mês"
          value={formatCurrency(account.spendThisMonth, account.currency)}
          isMono
        />
      </div>

      {/* Mobile data summary */}
      <div className="flex lg:hidden flex-1 min-w-0">
        <DataColumn
          label="Hoje"
          value={formatCurrency(account.spendToday, account.currency)}
          isMono
        />
      </div>

      {/* Status badge */}
      <Badge
        variant="outline"
        className={`shrink-0 text-[10px] ${statusBadge.className}`}
      >
        {statusBadge.label}
      </Badge>

      {/* Actions menu */}
      <RowMenu accountId={account.accountId} />
    </div>
  );
}
