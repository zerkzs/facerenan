import type { BusinessUserRole, InviteResult } from "./value-objects";

export interface MetaApiClient {
  fetchBmName(bmId: string, accessToken: string): Promise<string | null>;
  exchangeForLongLivedToken(
    shortToken: string,
    appId: string,
    appSecret: string
  ): Promise<{ accessToken: string; expiresIn: number }>;
  inviteBusinessUser(
    businessId: string,
    email: string,
    role: BusinessUserRole,
    accessToken: string
  ): Promise<InviteResult>;
}
