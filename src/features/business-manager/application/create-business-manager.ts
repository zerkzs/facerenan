import type { BusinessManager } from "../domain/entities";
import type { BusinessManagerRepository } from "../domain/repository";
import type { MetaApiClient } from "../domain/meta-api-client";
import type { CreateBusinessManagerDto } from "./dto";

export class CreateBusinessManager {
  constructor(
    private readonly repo: BusinessManagerRepository,
    private readonly metaApi: MetaApiClient
  ) {}

  async execute(
    userId: string,
    input: CreateBusinessManagerDto
  ): Promise<BusinessManager> {
    const existing = await this.repo.findByBmId(input.bmId, userId);
    if (existing) {
      throw new Error(`Business Manager ${input.bmId} already exists`);
    }

    const bmName = await this.metaApi
      .fetchBmName(input.bmId, input.userToken)
      .catch(() => null);

    let userToken = input.userToken;
    let tokenExpiresAt: Date | null = null;
    let lastRenewedAt: Date | null = null;

    if (input.autoRenew) {
      try {
        const result = await this.metaApi.exchangeForLongLivedToken(
          input.userToken,
          input.appId,
          input.appSecret
        );
        userToken = result.accessToken;
        tokenExpiresAt = new Date(Date.now() + result.expiresIn * 1000);
        lastRenewedAt = new Date();
      } catch {
        // Keep original token if exchange fails — user can retry later
      }
    }

    return this.repo.create({
      userId,
      bmId: input.bmId,
      bmName,
      userToken,
      systemToken: input.systemToken ?? null,
      appId: input.appId,
      appSecret: input.appSecret,
      tokenExpiresAt,
      autoRenew: input.autoRenew,
      lastRenewedAt,
      status: "active",
    });
  }
}
