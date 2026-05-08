export interface BmCredentials {
  readonly userToken: string;
  readonly systemToken: string | null;
  readonly appId: string;
  readonly appSecret: string;
}

export interface BmTokenRenewalResult {
  readonly longLivedToken: string;
  readonly expiresAt: Date;
}

export type BusinessUserRole = "EMPLOYEE" | "ADMIN";

export type InviteStatus = "success" | "already_member" | "error";

export interface InviteResult {
  readonly email: string;
  readonly status: InviteStatus;
  readonly message: string;
}
