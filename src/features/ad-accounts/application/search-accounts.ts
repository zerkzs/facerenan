import type { AccountIndexEntry } from "../domain/entities";
import type { AccountIndexRepository } from "../domain/repository";

export class SearchAccounts {
  constructor(private readonly indexRepo: AccountIndexRepository) {}

  async execute(
    userId: string,
    query: string
  ): Promise<AccountIndexEntry[]> {
    return this.indexRepo.searchByAccountId(userId, query);
  }
}
