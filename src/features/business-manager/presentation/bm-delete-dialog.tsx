"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BusinessManager } from "../domain/entities";

interface BmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  bm: BusinessManager | null;
}

export function BmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  bm,
}: BmDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!bm) return;
    setIsDeleting(true);
    try {
      await onConfirm(bm.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[oklch(0.15_0_0)] border-white/[0.08] sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <DialogTitle className="font-heading text-base">
                Remove Business Manager
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-sm font-medium text-foreground">
            {bm?.bmName ?? bm?.bmId}
          </p>
          <p className="text-xs text-muted-foreground">
            ID: {bm?.bmId}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          All stored credentials for this Business Manager will be permanently
          deleted.
        </p>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-500/15 text-red-400 hover:bg-red-500/25"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Remove"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
