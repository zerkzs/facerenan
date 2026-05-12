import type { AdAccount } from "../domain/entities";
import { ACCOUNT_STATUS_MAP } from "../domain/entities";
import type { AdAccountsMetaApiClient } from "../domain/meta-api-client";
import type { AccountIndexRepository } from "../domain/repository";
import type { BusinessManagerRepository } from "@/features/business-manager/domain/repository";

export class ListAdAccounts {
  constructor(
    private readonly bmRepo: BusinessManagerRepository,
    private readonly metaApi: AdAccountsMetaApiClient,
    private readonly indexRepo: AccountIndexRepository
  ) {}

  async execute(userId: string, bmInternalId: string): Promise<AdAccount[]> {
    const bm = await this.bmRepo.findById(bmInternalId, userId);
    if (!bm) {
      throw new Error("Business Manager not found");
    }

    const rawAccounts = await this.metaApi.fetchOwnedAdAccounts(
      bm.bmId,
      bm.userToken
    );

    // Fetch insights for all accounts in parallel
    const accountsWithInsights = await Promise.all(
      rawAccounts.map(async (raw) => {
        const [todayInsights, monthInsights] = await Promise.all([
          this.metaApi
            .fetchInsights(raw.id, "today", bm.userToken)
            .catch(() => null),
          this.metaApi
            .fetchInsights(raw.id, "this_month", bm.userToken)
            .catch(() => null),
        ]);

        const account: AdAccount = {
          accountId: raw.account_id,
          name: raw.name,
          status: ACCOUNT_STATUS_MAP[raw.account_status] ?? "restricted",
          rawStatus: raw.account_status,
          currency: raw.currency,
          fundingSourceDetails: raw.funding_source_details
            ? {
                displayString:
                  raw.funding_source_details.display_string ?? null,
                type: raw.funding_source_details.type ?? null,
              }
            : null,
          spendCap: raw.spend_cap ?? null,
          spendToday: todayInsights?.spend ?? null,
          spendThisMonth: monthInsights?.spend ?? null,
          bmId: bm.bmId,
        };

        return account;
      })
    );

    // Update account index cache
    const indexEntries = rawAccounts.map((raw) => ({
      userId,
      accountId: raw.account_id,
      bmId: bm.bmId,
      name: raw.name,
    }));

    await this.indexRepo.upsertMany(userId, indexEntries).catch(() => {
      // Cache update failure should not break the main flow
    });

    return accountsWithInsights;
  }
}
