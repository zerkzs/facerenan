"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { BusinessManager } from "../domain/entities";
import type { CreateBusinessManagerDto, UpdateBusinessManagerDto } from "../application/dto";

interface UseBusinessManagersReturn {
  businessManagers: BusinessManager[];
  isLoading: boolean;
  createBm: (data: CreateBusinessManagerDto) => Promise<BusinessManager | null>;
  updateBm: (id: string, data: UpdateBusinessManagerDto) => Promise<BusinessManager | null>;
  deleteBm: (id: string) => Promise<boolean>;
  renewToken: (id: string) => Promise<BusinessManager | null>;
  fetchBmName: (bmId: string, accessToken: string) => Promise<string | null>;
  refresh: () => Promise<void>;
}

async function loadBusinessManagers(): Promise<BusinessManager[]> {
  const res = await fetch("/api/business-managers");
  if (!res.ok) throw new Error("Failed to load Business Managers");
  return res.json();
}

export function useBusinessManagers(): UseBusinessManagersReturn {
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    loadBusinessManagers()
      .then((data) => {
        if (!isCancelled) setBusinessManagers(data);
      })
      .catch((err) => {
        if (!isCancelled) {
          toast.error("Error", {
            description:
              err instanceof Error ? err.message : "Failed to load BMs",
          });
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadBusinessManagers();
      setBusinessManagers(data);
    } catch (err) {
      toast.error("Error", {
        description: err instanceof Error ? err.message : "Failed to load BMs",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBm = useCallback(
    async (data: CreateBusinessManagerDto): Promise<BusinessManager | null> => {
      try {
        const res = await fetch("/api/business-managers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Failed to create BM");
        }

        const bm = await res.json();
        toast.success("Business Manager added", {
          description: bm.bmName ?? bm.bmId,
        });
        await fetchList();
        return bm;
      } catch (err) {
        toast.error("Error", {
          description: err instanceof Error ? err.message : "Failed to create BM",
        });
        return null;
      }
    },
    [fetchList]
  );

  const updateBm = useCallback(
    async (
      id: string,
      data: UpdateBusinessManagerDto
    ): Promise<BusinessManager | null> => {
      try {
        const res = await fetch(`/api/business-managers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Failed to update BM");
        }

        const bm = await res.json();
        toast.success("Business Manager updated", {
          description: bm.bmName ?? bm.bmId,
        });
        await fetchList();
        return bm;
      } catch (err) {
        toast.error("Error", {
          description: err instanceof Error ? err.message : "Failed to update BM",
        });
        return null;
      }
    },
    [fetchList]
  );

  const deleteBm = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/business-managers/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Failed to delete BM");
        }

        toast.success("Business Manager removed");
        await fetchList();
        return true;
      } catch (err) {
        toast.error("Error", {
          description: err instanceof Error ? err.message : "Failed to delete BM",
        });
        return false;
      }
    },
    [fetchList]
  );

  const renewToken = useCallback(
    async (id: string): Promise<BusinessManager | null> => {
      try {
        const res = await fetch(
          `/api/business-managers/${id}/renew-token`,
          { method: "POST" }
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Token renewal failed");
        }

        const bm = await res.json();
        toast.success("Token renewed", {
          description: bm.bmName ?? bm.bmId,
        });
        await fetchList();
        return bm;
      } catch (err) {
        toast.error("Token renewal failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
        return null;
      }
    },
    [fetchList]
  );

  const fetchBmName = useCallback(
    async (bmId: string, accessToken: string): Promise<string | null> => {
      try {
        const res = await fetch("/api/business-managers/fetch-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bmId, accessToken }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.name ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  return {
    businessManagers,
    isLoading,
    createBm,
    updateBm,
    deleteBm,
    renewToken,
    fetchBmName,
    refresh: fetchList,
  };
}
