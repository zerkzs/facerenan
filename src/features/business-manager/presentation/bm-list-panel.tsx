"use client";

import { Plus, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BmCard } from "./bm-card";
import type { BusinessManager } from "../domain/entities";

interface BmListPanelProps {
  businessManagers: BusinessManager[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (bm: BusinessManager) => void;
  onDelete: (bm: BusinessManager) => void;
  onRenewToken: (id: string) => Promise<void>;
}

export function BmListPanel({
  businessManagers,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onRenewToken,
}: BmListPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neon/50" />
      </div>
    );
  }

  if (businessManagers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
          No Business Managers
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Add your first BM to get started
        </p>
        <Button
          onClick={onAdd}
          className="bg-neon text-black font-medium hover:bg-neon-hover"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add BM
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Business Managers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your Business Managers and access tokens
          </p>
        </div>
        <Button
          onClick={onAdd}
          className="bg-neon text-black font-medium hover:bg-neon-hover"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add BM
        </Button>
      </div>

      <div className="space-y-2">
        {businessManagers.map((bm) => (
          <BmCard
            key={bm.id}
            bm={bm}
            onEdit={onEdit}
            onDelete={onDelete}
            onRenewToken={onRenewToken}
          />
        ))}
      </div>
    </div>
  );
}
