import type {
  AdAccountsMetaApiClient,
  MetaAdAccountRaw,
  MetaInsightsRaw,
} from "../domain/meta-api-client";

export class MetaAdAccountsApiClient implements AdAccountsMetaApiClient {
  private readonly baseUrl: string;

  constructor() {
    const version = process.env.META_API_VERSION ?? "v25.0";
    this.baseUrl = `https://graph.facebook.com/${version}`;
  }

  async fetchOwnedAdAccounts(
    bmId: string,
    accessToken: string
  ): Promise<MetaAdAccountRaw[]> {
    const accounts: MetaAdAccountRaw[] = [];
    let url: string | null = `${this.baseUrl}/${encodeURIComponent(bmId)}/owned_ad_accounts?fields=name,account_id,account_status,funding_source_details,spend_cap,currency&limit=100&access_token=${encodeURIComponent(accessToken)}`;

    while (url) {
      const res = await fetch(url);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(
          body?.error?.message ??
            `Failed to fetch ad accounts (HTTP ${res.status})`
        );
      }

      const data = (await res.json()) as {
        data: MetaAdAccountRaw[];
        paging?: { next?: string };
      };

      accounts.push(...data.data);
      url = data.paging?.next ?? null;
    }

    return accounts;
  }

  async fetchInsights(
    accountId: string,
    datePreset: "today" | "this_month",
    accessToken: string
  ): Promise<MetaInsightsRaw | null> {
    const actId = accountId.startsWith("act_")
      ? accountId
      : `act_${accountId}`;
    const url = `${this.baseUrl}/${encodeURIComponent(actId)}/insights?date_preset=${datePreset}&fields=spend&access_token=${encodeURIComponent(accessToken)}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as {
      data?: MetaInsightsRaw[];
    };

    return data.data?.[0] ?? null;
  }
}
