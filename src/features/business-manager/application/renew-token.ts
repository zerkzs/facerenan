import type { BusinessManager } from "../domain/entities";
import type { BusinessManagerRepository } from "../domain/repository";
import type { MetaApiClient } from "../domain/meta-api-client";

export class RenewToken {
  constructor(
    private readonly repo: BusinessManagerRepository,
    private readonly metaApi: MetaApiClient
  ) {}

  async execute(id: string, userId: string): Promise<BusinessManager> {
    const bm = await this.repo.findById(id, userId);
    if (!bm) {
      throw new Error("Business Manager not found");
    }

    const result = await this.metaApi.exchangeForLongLivedToken(
      bm.userToken,
      bm.appId,
      bm.appSecret
    );

    return this.repo.update(id, userId, {
      userToken: result.accessToken,
      tokenExpiresAt: new Date(Date.now() + result.expiresIn * 1000),
      lastRenewedAt: new Date(),
      status: "active",
    });
  }
}
