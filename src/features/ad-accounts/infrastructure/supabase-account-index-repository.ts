import type { AccountIndexRepository } from "../domain/repository";
import type { AccountIndexEntry } from "../domain/entities";
import { createSupabaseServerClient } from "@/features/auth/infrastructure/supabase-client";

interface AccountIndexRow {
  id: string;
  user_id: string;
  account_id: string;
  bm_id: string;
  name: string | null;
  last_synced: string;
}

function toEntry(row: AccountIndexRow): AccountIndexEntry {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    bmId: row.bm_id,
    name: row.name,
    lastSynced: new Date(row.last_synced),
  };
}

export class SupabaseAccountIndexRepository
  implements AccountIndexRepository
{
  private get db() {
    return createSupabaseServerClient();
  }

  async upsertMany(
    userId: string,
    entries: Omit<AccountIndexEntry, "id" | "lastSynced">[]
  ): Promise<void> {
    if (entries.length === 0) return;

    const rows = entries.map((e) => ({
      user_id: userId,
      account_id: e.accountId,
      bm_id: e.bmId,
      name: e.name,
      last_synced: new Date().toISOString(),
    }));

    const { error } = await this.db
      .from("account_index")
      .upsert(rows, { onConflict: "user_id,account_id,bm_id" });

    if (error) {
      throw new Error(`Failed to upsert account index: ${error.message}`);
    }
  }

  async searchByAccountId(
    userId: string,
    query: string
  ): Promise<AccountIndexEntry[]> {
    const { data, error } = await this.db
      .from("account_index")
      .select("*")
      .eq("user_id", userId)
      .ilike("account_id", `%${query}%`)
      .order("last_synced", { ascending: false })
      .limit(50)
      .returns<AccountIndexRow[]>();

    if (error) {
      throw new Error(`Failed to search account index: ${error.message}`);
    }

    return (data ?? []).map(toEntry);
  }

  async findByBmId(
    userId: string,
    bmId: string
  ): Promise<AccountIndexEntry[]> {
    const { data, error } = await this.db
      .from("account_index")
      .select("*")
      .eq("user_id", userId)
      .eq("bm_id", bmId)
      .order("name", { ascending: true })
      .returns<AccountIndexRow[]>();

    if (error) {
      throw new Error(`Failed to find accounts by BM: ${error.message}`);
    }

    return (data ?? []).map(toEntry);
  }
}
