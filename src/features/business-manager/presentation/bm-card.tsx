"use client";

import { useState, useRef, useEffect } from "react";
import {
  Pencil,
  Trash2,
  RefreshCw,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BusinessManager } from "../domain/entities";

interface BmCardProps {
  bm: BusinessManager;
  onEdit: (bm: BusinessManager) => void;
  onDelete: (bm: BusinessManager) => void;
  onRenewToken: (id: string) => Promise<void>;
}

const STATUS_DOT_CLASS = {
  active: "bg-neon",
  expired: "bg-yellow-400",
  error: "bg-red-400",
} as const;

const STATUS_BADGE = {
  active: {
    label: "Active",
    className: "bg-neon/15 text-neon border-neon/30",
  },
  expired: {
    label: "Expired",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  error: {
    label: "Error",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
} as const;

function truncateToken(value: string | null, length = 14): string {
  if (!value) return "\u2014";
  if (value.length <= length) return value;
  return value.slice(0, length) + "...";
}

function RowMenu({
  onEdit,
  onRenew,
  onDelete,
  isRenewing,
}: {
  onEdit: () => void;
  onRenew: () => void;
  onDelete: () => void;
  isRenewing: boolean;
}) {
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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-white/[0.08] bg-[oklch(0.17_0_0)] p-1 shadow-xl">
          <button
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-white/[0.06]"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            Edit
          </button>
          <button
            onClick={() => {
              onRenew();
              setIsOpen(false);
            }}
            disabled={isRenewing}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-white/[0.06] disabled:opacity-50"
          >
            {isRenewing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-neon" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            Renew Token
          </button>
          <div className="my-1 h-px bg-white/[0.06]" />
          <button
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function CredentialColumn({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  const display = truncateToken(value);
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-0.5">
        {label}
      </p>
      <p
        className={`text-xs font-mono truncate ${value ? "text-foreground/70" : "text-muted-foreground/40"}`}
        title={value ?? undefined}
      >
        {display}
      </p>
    </div>
  );
}

export function BmCard({ bm, onEdit, onDelete, onRenewToken }: BmCardProps) {
  const [isRenewing, setIsRenewing] = useState(false);
  const statusBadge = STATUS_BADGE[bm.status];

  async function handleRenew() {
    setIsRenewing(true);
    try {
      await onRenewToken(bm.id);
    } finally {
      setIsRenewing(false);
    }
  }

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all hover:border-neon/20 hover:bg-white/[0.04]">
      {/* Status dot */}
      <div
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT_CLASS[bm.status]}`}
      />

      {/* Name + ID */}
      <div className="min-w-0 w-44 shrink-0">
        <p className="truncate font-heading text-sm font-semibold text-foreground">
          {bm.bmName ?? "Loading name..."}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          ID: {bm.bmId}
        </p>
      </div>

      {/* Credential columns */}
      <div className="hidden lg:grid flex-1 grid-cols-4 gap-4 min-w-0">
        <CredentialColumn label="Token Usuario" value={bm.userToken} />
        <CredentialColumn label="System User" value={bm.systemToken} />
        <CredentialColumn label="App ID" value={bm.appId} />
        <CredentialColumn label="App Secret" value={bm.appSecret} />
      </div>

      {/* Status badge */}
      <Badge
        variant="outline"
        className={`shrink-0 text-[10px] ${statusBadge.className}`}
      >
        {statusBadge.label}
      </Badge>

      {/* Actions menu */}
      <RowMenu
        onEdit={() => onEdit(bm)}
        onRenew={handleRenew}
        onDelete={() => onDelete(bm)}
        isRenewing={isRenewing}
      />
    </div>
  );
}
