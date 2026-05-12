"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  Megaphone,
  Loader2,
  ChevronDown,
  X,
} from "lucide-react";
import { AdAccountCard } from "./ad-account-card";
import { useAdAccounts } from "./use-ad-accounts";
import type { BusinessManager } from "@/features/business-manager/domain/entities";
import type { AdAccount, AdAccountStatus } from "../domain/entities";

type FilterId =
  | "all"
  | "active"
  | "restricted"
  | "paused"
  | "no-spend"
  | "spending";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "active", label: "Ativas" },
  { id: "restricted", label: "Restritas" },
  { id: "paused", label: "Pausadas" },
  { id: "no-spend", label: "Sem gastos" },
  { id: "spending", label: "Gastando hoje" },
];

function filterAccounts(
  accounts: AdAccount[],
  filter: FilterId
): AdAccount[] {
  switch (filter) {
    case "active":
      return accounts.filter((a) => a.status === "active");
    case "restricted":
      return accounts.filter((a) => a.status === "restricted");
    case "paused":
      return accounts.filter((a) => a.status === "paused");
    case "no-spend":
      return accounts.filter(
        (a) => !a.spendToday || parseFloat(a.spendToday) === 0
      );
    case "spending":
      return accounts.filter(
        (a) => a.spendToday && parseFloat(a.spendToday) > 0
      );
    default:
      return accounts;
  }
}

function countByStatus(
  accounts: AdAccount[],
  status: AdAccountStatus
): number {
  return accounts.filter((a) => a.status === status).length;
}

function sumSpendToday(accounts: AdAccount[], currency: string): string {
  const total = accounts.reduce((sum, a) => {
    if (!a.spendToday) return sum;
    const val = parseFloat(a.spendToday);
    return isNaN(val) ? sum : sum + val;
  }, 0);
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(total);
  } catch {
    return `${currency} ${total.toFixed(2)}`;
  }
}

interface BmSelectorProps {
  businessManagers: BusinessManager[];
  selectedBmId: string | null;
  onSelect: (bmId: string) => void;
}

function BmSelector({
  businessManagers,
  selectedBmId,
  onSelect,
}: BmSelectorProps) {
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

  const selectedBm = businessManagers.find((bm) => bm.id === selectedBmId);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm transition-colors hover:bg-white/[0.06] min-w-[200px]"
      >
        <span
          className={
            selectedBm ? "text-foreground" : "text-muted-foreground"
          }
        >
          {selectedBm
            ? selectedBm.bmName ?? selectedBm.bmId
            : "Selecionar BM"}
        </span>
        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[240px] rounded-lg border border-white/[0.08] bg-[oklch(0.17_0_0)] p-1 shadow-xl">
          {businessManagers.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Nenhuma BM cadastrada
            </p>
          ) : (
            businessManagers.map((bm) => (
              <button
                key={bm.id}
                onClick={() => {
                  onSelect(bm.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/[0.06] ${
                  bm.id === selectedBmId
                    ? "text-neon bg-neon/10"
                    : "text-foreground"
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    bm.status === "active"
                      ? "bg-neon"
                      : bm.status === "expired"
                        ? "bg-yellow-400"
                        : "bg-red-400"
                  }`}
                />
                <span className="truncate">
                  {bm.bmName ?? bm.bmId}
                </span>
                <span className="ml-auto text-[11px] text-muted-foreground font-mono">
                  {bm.bmId}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface AdAccountListPanelProps {
  businessManagers: BusinessManager[];
}

export function AdAccountListPanel({
  businessManagers,
}: AdAccountListPanelProps) {
  const [selectedBmId, setSelectedBmId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    accounts,
    isLoading,
    searchResults,
    isSearching,
    loadAccounts,
    searchAccounts,
    clearSearch,
  } = useAdAccounts();

  const handleSelectBm = useCallback(
    (bmId: string) => {
      setSelectedBmId(bmId);
      setIsSearchMode(false);
      setSearchQuery("");
      clearSearch();
      loadAccounts(bmId);
    },
    [loadAccounts, clearSearch]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (value.trim().length === 0) {
        setIsSearchMode(false);
        clearSearch();
        return;
      }

      setIsSearchMode(true);
      searchTimeoutRef.current = setTimeout(() => {
        searchAccounts(value);
      }, 400);
    },
    [searchAccounts, clearSearch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearchMode(false);
    clearSearch();
  }, [clearSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const filteredAccounts = useMemo(
    () => filterAccounts(accounts, activeFilter),
    [accounts, activeFilter]
  );

  const activeCount = countByStatus(accounts, "active");
  const restrictedCount = countByStatus(accounts, "restricted");
  const mainCurrency = accounts[0]?.currency ?? "BRL";
  const totalSpendToday = sumSpendToday(accounts, mainCurrency);

  const hasSelectedBm = selectedBmId !== null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Contas de Anúncio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualize e gerencie as contas de anúncio das suas BMs
        </p>
      </div>

      {/* Controls: BM selector + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <BmSelector
          businessManagers={businessManagers}
          selectedBmId={selectedBmId}
          onSelect={handleSelectBm}
        />
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por ID em todas as BMs"
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-neon/40 focus:outline-none focus:ring-1 focus:ring-neon/20"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Counters — only show when a BM is selected and not in search mode */}
      {hasSelectedBm && !isSearchMode && accounts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <CounterCard label="Total" value={accounts.length.toString()} />
          <CounterCard
            label="Ativas"
            value={activeCount.toString()}
            valueClassName="text-neon"
          />
          <CounterCard
            label="Restritas"
            value={restrictedCount.toString()}
            valueClassName={
              restrictedCount > 0 ? "text-red-400" : undefined
            }
          />
          <CounterCard label="Gasto total hoje" value={totalSpendToday} />
        </div>
      )}

      {/* Filters — only show when a BM is selected and not in search mode */}
      {hasSelectedBm && !isSearchMode && accounts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeFilter === f.id
                  ? "bg-neon/15 text-neon border border-neon/30"
                  : "bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.06] hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isSearchMode ? (
        <SearchResultsView
          results={searchResults}
          isSearching={isSearching}
          query={searchQuery}
          businessManagers={businessManagers}
          onSelectBm={handleSelectBm}
        />
      ) : !hasSelectedBm ? (
        <EmptyState />
      ) : isLoading ? (
        <LoadingState />
      ) : filteredAccounts.length === 0 ? (
        <NoResultsState
          hasAccounts={accounts.length > 0}
          filterLabel={
            FILTERS.find((f) => f.id === activeFilter)?.label ?? ""
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredAccounts.map((account) => (
            <AdAccountCard key={account.accountId} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}

function CounterCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-1">
        {label}
      </p>
      <p
        className={`text-lg font-heading font-semibold ${valueClassName ?? "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] mb-4">
        <Megaphone className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
        Selecione uma BM
      </h2>
      <p className="text-sm text-muted-foreground">
        Selecione uma BM para ver as contas de anúncio
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-neon/50" />
    </div>
  );
}

function NoResultsState({
  hasAccounts,
  filterLabel,
}: {
  hasAccounts: boolean;
  filterLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] mb-4">
        <Megaphone className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
        {hasAccounts
          ? "Nenhuma conta encontrada"
          : "Nenhuma conta de anúncio"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {hasAccounts
          ? `Nenhuma conta corresponde ao filtro "${filterLabel}"`
          : "Esta BM não possui contas de anúncio"}
      </p>
    </div>
  );
}

function SearchResultsView({
  results,
  isSearching,
  query,
  businessManagers,
  onSelectBm,
}: {
  results: { accountId: string; bmId: string; name: string | null }[];
  isSearching: boolean;
  query: string;
  businessManagers: BusinessManager[];
  onSelectBm: (bmId: string) => void;
}) {
  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neon/50" />
      </div>
    );
  }

  if (results.length === 0 && query.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] mb-4">
          <Search className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
          Nenhum resultado
        </h2>
        <p className="text-sm text-muted-foreground">
          Nenhuma conta encontrada para &quot;{query}&quot;
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2">
          Selecione uma BM primeiro para sincronizar o cache
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        {results.length} resultado{results.length !== 1 ? "s" : ""} encontrado
        {results.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-2">
        {results.map((r) => {
          const bm = businessManagers.find((b) => b.bmId === r.bmId);
          return (
            <button
              key={`${r.accountId}-${r.bmId}`}
              onClick={() => {
                if (bm) onSelectBm(bm.id);
              }}
              className="group flex w-full items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left transition-all hover:border-neon/20 hover:bg-white/[0.04]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-sm font-semibold text-foreground">
                  {r.name ?? "Unknown"}
                </p>
                <p className="truncate text-[11px] font-mono text-muted-foreground">
                  act_{r.accountId}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  BM
                </p>
                <p className="text-xs text-foreground/70">
                  {bm?.bmName ?? r.bmId}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
