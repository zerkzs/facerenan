export interface MetaAdAccountRaw {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  funding_source_details?: {
    display_string?: string;
    type?: number;
  };
  spend_cap?: string;
}

export interface MetaInsightsRaw {
  spend?: string;
}

export interface AdAccountsMetaApiClient {
  fetchOwnedAdAccounts(
    bmId: string,
    accessToken: string
  ): Promise<MetaAdAccountRaw[]>;
  fetchInsights(
    accountId: string,
    datePreset: "today" | "this_month",
    accessToken: string
  ): Promise<MetaInsightsRaw | null>;
}
