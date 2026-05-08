export type BusinessManagerStatus = "active" | "expired" | "error";

export interface BusinessManager {
  id: string;
  userId: string;
  bmId: string;
  bmName: string | null;
  userToken: string;
  systemToken: string | null;
  appId: string;
  appSecret: string;
  tokenExpiresAt: Date | null;
  autoRenew: boolean;
  lastRenewedAt: Date | null;
  status: BusinessManagerStatus;
  createdAt: Date;
  updatedAt: Date;
}
