"use client";

import { useState } from "react";
import {
  Plus,
  Building2,
  Loader2,
  Menu,
  LogOut,
  UserPlus,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BmCard } from "./bm-card";
import { BmFormDialog } from "./bm-form-dialog";
import { BmDeleteDialog } from "./bm-delete-dialog";
import { InviteMembersDialog } from "./invite-members-dialog";
import { useBusinessManagers } from "./use-business-managers";
import type { BusinessManager } from "../domain/entities";
import type {
  CreateBusinessManagerDto,
  UpdateBusinessManagerDto,
} from "../application/dto";

function SidebarLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon/10">
        <Building2 className="h-4 w-4 text-neon" />
      </div>
      <span className="font-heading text-sm font-semibold text-foreground">
        Meta Ads Manager
      </span>
    </div>
  );
}

function SidebarContent({
  businessManagers,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onRenewToken,
  onInvite,
}: {
  businessManagers: BusinessManager[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (bm: BusinessManager) => void;
  onDelete: (bm: BusinessManager) => void;
  onRenewToken: (id: string) => Promise<void>;
  onInvite: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5">
        <SidebarLogo />
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* BM Section Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Business Managers
        </h2>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onAdd}
          className="text-neon hover:text-neon hover:bg-neon/10"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* BM List */}
      <ScrollArea className="flex-1 px-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-neon/50" />
          </div>
        ) : businessManagers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] mb-3">
              <Building2 className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              No Business Managers
            </p>
            <p className="text-xs text-muted-foreground/60 mb-4">
              Add your first BM to get started
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
              className="border-neon/20 text-neon hover:bg-neon/10 hover:border-neon/40"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add BM
            </Button>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
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
        )}
      </ScrollArea>

      {/* Footer */}
      <Separator className="bg-white/[0.06]" />
      <div className="px-4 py-3 space-y-1">
        {businessManagers.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onInvite}
            className="w-full justify-start text-muted-foreground hover:text-neon"
          >
            <UserPlus className="h-3.5 w-3.5 mr-2" />
            Invite Members
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function BmSidebar() {
  const {
    businessManagers,
    isLoading,
    createBm,
    updateBm,
    deleteBm,
    renewToken,
    fetchBmName,
  } = useBusinessManagers();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBm, setEditingBm] = useState<BusinessManager | null>(null);
  const [deletingBm, setDeletingBm] = useState<BusinessManager | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  function handleAdd() {
    setEditingBm(null);
    setIsFormOpen(true);
  }

  function handleEdit(bm: BusinessManager) {
    setEditingBm(bm);
    setIsFormOpen(true);
  }

  async function handleFormSubmit(
    data: CreateBusinessManagerDto | UpdateBusinessManagerDto
  ) {
    let result;
    if (editingBm) {
      result = await updateBm(editingBm.id, data as UpdateBusinessManagerDto);
    } else {
      result = await createBm(data as CreateBusinessManagerDto);
    }
    if (!result) {
      throw new Error("Failed to save Business Manager. Check your credentials and try again.");
    }
  }

  async function handleDelete(id: string) {
    await deleteBm(id);
  }

  async function handleRenewToken(id: string) {
    await renewToken(id);
  }

  const sidebarProps = {
    businessManagers,
    isLoading,
    onAdd: handleAdd,
    onEdit: handleEdit,
    onDelete: setDeletingBm,
    onRenewToken: handleRenewToken,
    onInvite: () => setIsInviteOpen(true),
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-white/[0.06] bg-sidebar">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile trigger + sheet */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="border-white/[0.08] bg-sidebar backdrop-blur-sm"
              />
            }
          >
            <Menu className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 border-white/[0.06] bg-sidebar p-0"
          >
            <SidebarContent {...sidebarProps} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Dialogs */}
      <BmFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        onFetchName={fetchBmName}
        editingBm={editingBm}
      />

      <BmDeleteDialog
        isOpen={!!deletingBm}
        onClose={() => setDeletingBm(null)}
        onConfirm={handleDelete}
        bm={deletingBm}
      />

      <InviteMembersDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        businessManagers={businessManagers}
      />
    </>
  );
}
