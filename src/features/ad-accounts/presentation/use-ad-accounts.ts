"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { AdAccount, AccountIndexEntry } from "../domain/entities";

interface UseAdAccountsReturn {
  accounts: AdAccount[];
  isLoading: boolean;
  searchResults: AccountIndexEntry[];
  isSearching: boolean;
  loadAccounts: (bmInternalId: string) => Promise<void>;
  searchAccounts: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export function useAdAccounts(): UseAdAccountsReturn {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<AccountIndexEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadAccounts = useCallback(async (bmInternalId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/ad-accounts?bm_id=${encodeURIComponent(bmInternalId)}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to load ad accounts");
      }
      const data: AdAccount[] = await res.json();
      setAccounts(data);
    } catch (err) {
      toast.error("Error", {
        description:
          err instanceof Error ? err.message : "Failed to load ad accounts",
      });
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchAccounts = useCallback(async (query: string) => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/ad-accounts/search?q=${encodeURIComponent(query.trim())}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Search failed");
      }
      const data: AccountIndexEntry[] = await res.json();
      setSearchResults(data);
    } catch (err) {
      toast.error("Error", {
        description:
          err instanceof Error ? err.message : "Search failed",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    accounts,
    isLoading,
    searchResults,
    isSearching,
    loadAccounts,
    searchAccounts,
    clearSearch,
  };
}
