import type { MetaApiClient } from "../domain/meta-api-client";

export interface FetchBmNameInput {
  bmId: string;
  accessToken: string;
}

export class FetchBmName {
  constructor(private readonly metaApi: MetaApiClient) {}

  async execute(input: FetchBmNameInput): Promise<string | null> {
    return this.metaApi.fetchBmName(input.bmId, input.accessToken);
  }
}
