export interface SessionInfo {
  readonly userId: string;
  readonly sessionToken: string;
  readonly expires: Date;
}
