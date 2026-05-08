import type { BusinessManagerRepository } from "../domain/repository";
import type { BusinessManager } from "../domain/entities";
import { encryptToken, decryptToken } from "@/lib/token-encryption";
import { createSupabaseServerClient } from "@/features/auth/infrastructure/supabase-client";

interface BmRow {
  id: string;
  user_id: string;
  bm_id: string;
  bm_name: string | null;
  user_token: string;
  system_token: string | null;
  app_id: string;
  app_secret: string;
  token_expires_at: string | null;
  auto_renew: boolean;
  last_renewed_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function toBm(row: BmRow): BusinessManager {
  return {
    id: row.id,
    userId: row.user_id,
    bmId: row.bm_id,
    bmName: row.bm_name,
    userToken: decryptToken(row.user_token),
    systemToken: row.system_token ? decryptToken(row.system_token) : null,
    appId: decryptToken(row.app_id),
    appSecret: decryptToken(row.app_secret),
    tokenExpiresAt: row.token_expires_at
      ? new Date(row.token_expires_at)
      : null,
    autoRenew: row.auto_renew,
    lastRenewedAt: row.last_renewed_at
      ? new Date(row.last_renewed_at)
      : null,
    status: row.status as BusinessManager["status"],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseBmRepository implements BusinessManagerRepository {
  private get db() {
    return createSupabaseServerClient();
  }

  async findByUserId(userId: string): Promise<BusinessManager[]> {
    const { data, error } = await this.db
      .from("business_managers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .returns<BmRow[]>();

    if (error) throw new Error(`Failed to list BMs: ${error.message}`);

    return (data ?? []).map(toBm);
  }

  async findById(
    id: string,
    userId: string
  ): Promise<BusinessManager | null> {
    const { data, error } = await this.db
      .from("business_managers")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single<BmRow>();

    if (error?.code === "PGRST116") return null;
    if (error) throw new Error(`Failed to find BM: ${error.message}`);

    return toBm(data);
  }

  async findByBmId(
    bmId: string,
    userId: string
  ): Promise<BusinessManager | null> {
    const { data, error } = await this.db
      .from("business_managers")
      .select("*")
      .eq("bm_id", bmId)
      .eq("user_id", userId)
      .single<BmRow>();

    if (error?.code === "PGRST116") return null;
    if (error) throw new Error(`Failed to find BM by bmId: ${error.message}`);

    return toBm(data);
  }

  async create(
    bm: Omit<BusinessManager, "id" | "createdAt" | "updatedAt">
  ): Promise<BusinessManager> {
    const { data, error } = await this.db
      .from("business_managers")
      .insert({
        user_id: bm.userId,
        bm_id: bm.bmId,
        bm_name: bm.bmName,
        user_token: encryptToken(bm.userToken),
        system_token: bm.systemToken ? encryptToken(bm.systemToken) : null,
        app_id: encryptToken(bm.appId),
        app_secret: encryptToken(bm.appSecret),
        token_expires_at: bm.tokenExpiresAt?.toISOString() ?? null,
        auto_renew: bm.autoRenew,
        last_renewed_at: bm.lastRenewedAt?.toISOString() ?? null,
        status: bm.status,
      })
      .select()
      .single<BmRow>();

    if (error) throw new Error(`Failed to create BM: ${error.message}`);

    return toBm(data);
  }

  async update(
    id: string,
    userId: string,
    data: Partial<BusinessManager>
  ): Promise<BusinessManager> {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.bmId !== undefined) updates.bm_id = data.bmId;
    if (data.bmName !== undefined) updates.bm_name = data.bmName;
    if (data.userToken !== undefined)
      updates.user_token = encryptToken(data.userToken);
    if (data.systemToken !== undefined)
      updates.system_token = data.systemToken
        ? encryptToken(data.systemToken)
        : null;
    if (data.appId !== undefined) updates.app_id = encryptToken(data.appId);
    if (data.appSecret !== undefined)
      updates.app_secret = encryptToken(data.appSecret);
    if (data.tokenExpiresAt !== undefined)
      updates.token_expires_at = data.tokenExpiresAt?.toISOString() ?? null;
    if (data.autoRenew !== undefined) updates.auto_renew = data.autoRenew;
    if (data.lastRenewedAt !== undefined)
      updates.last_renewed_at = data.lastRenewedAt?.toISOString() ?? null;
    if (data.status !== undefined) updates.status = data.status;

    const { data: row, error } = await this.db
      .from("business_managers")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single<BmRow>();

    if (error) throw new Error(`Failed to update BM: ${error.message}`);

    return toBm(row);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.db
      .from("business_managers")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to delete BM: ${error.message}`);
  }
}
