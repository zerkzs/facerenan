"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Building2,
  Megaphone,
  UserPlus,
  LogOut,
  Menu,
  Loader2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BmListPanel } from "./bm-list-panel";
import { InvitePanel } from "./invite-panel";
import { BmFormDialog } from "./bm-form-dialog";
import { BmDeleteDialog } from "./bm-delete-dialog";
import { useBusinessManagers } from "./use-business-managers";
import type { BusinessManager } from "../domain/entities";
import type {
  CreateBusinessManagerDto,
  UpdateBusinessManagerDto,
} from "../application/dto";

type TabId = "bms" | "ad-accounts" | "invite";

const TABS: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: "bms", label: "BMs", icon: Building2 },
  { id: "ad-accounts", label: "Contas de Anúncio", icon: Megaphone },
  { id: "invite", label: "Adicionar Pessoas", icon: UserPlus },
];

function DashboardShellInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawTab = searchParams.get("tab");
  const activeTab: TabId =
    rawTab === "ad-accounts" || rawTab === "invite" ? rawTab : "bms";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBm, setEditingBm] = useState<BusinessManager | null>(null);
  const [deletingBm, setDeletingBm] = useState<BusinessManager | null>(null);

  const {
    businessManagers,
    isLoading,
    createBm,
    updateBm,
    deleteBm,
    renewToken,
    fetchBmName,
  } = useBusinessManagers();

  const setTab = useCallback(
    (tab: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      setMobileOpen(false);
    },
    [searchParams, router, pathname]
  );

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
      throw new Error(
        "Failed to save Business Manager. Check your credentials and try again."
      );
    }
  }

  async function handleDelete(id: string) {
    await deleteBm(id);
  }

  async function handleRenewToken(id: string) {
    await renewToken(id);
  }

  const navItems = (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-neon/10 text-neon"
                : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon/10">
          <Building2 className="h-4 w-4 text-neon" />
        </div>
        <span className="font-heading text-sm font-semibold text-foreground">
          Meta Ads Manager
        </span>
      </div>

      <Separator className="bg-white/[0.06]" />

      {navItems}

      <Separator className="bg-white/[0.06]" />

      {/* Sign out */}
      <div className="px-4 py-3">
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — fixed */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-sidebar fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile trigger + sheet */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
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
            className="w-64 border-white/[0.06] bg-sidebar p-0"
          >
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Content area */}
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 pt-16 lg:pt-8">
        {activeTab === "bms" && (
          <BmListPanel
            businessManagers={businessManagers}
            isLoading={isLoading}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={setDeletingBm}
            onRenewToken={handleRenewToken}
          />
        )}

        {activeTab === "ad-accounts" && (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] mb-4">
              <Megaphone className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
              Ad Accounts
            </h2>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </div>
        )}

        {activeTab === "invite" && (
          <InvitePanel businessManagers={businessManagers} />
        )}
      </main>

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
    </div>
  );
}

export function DashboardShell() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-neon/50" />
        </div>
      }
    >
      <DashboardShellInner />
    </Suspense>
  );
}
