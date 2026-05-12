export type AdAccountStatus = "active" | "restricted" | "paused" | "closed";

export const ACCOUNT_STATUS_MAP: Record<number, AdAccountStatus> = {
  1: "active",
  2: "restricted",
  3: "restricted",
  7: "paused",
  8: "paused",
  9: "paused",
  100: "closed",
  101: "closed",
};

export interface AdAccount {
  accountId: string;
  name: string;
  status: AdAccountStatus;
  rawStatus: number;
  currency: string;
  fundingSourceDetails: FundingSourceDetails | null;
  spendCap: string | null;
  spendToday: string | null;
  spendThisMonth: string | null;
  bmId: string;
}

export interface FundingSourceDetails {
  displayString: string | null;
  type: number | null;
}

export interface AccountIndexEntry {
  id: string;
  userId: string;
  accountId: string;
  bmId: string;
  name: string | null;
  lastSynced: Date;
}
