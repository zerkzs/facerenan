export interface MetaTokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: Date;
}

export interface SessionInfo {
  readonly userId: string;
  readonly sessionToken: string;
  readonly expires: Date;
}
