import type { AccountIndexEntry } from "./entities";

export interface AccountIndexRepository {
  upsertMany(
    userId: string,
    entries: Omit<AccountIndexEntry, "id" | "lastSynced">[]
  ): Promise<void>;
  searchByAccountId(
    userId: string,
    query: string
  ): Promise<AccountIndexEntry[]>;
  findByBmId(userId: string, bmId: string): Promise<AccountIndexEntry[]>;
}
