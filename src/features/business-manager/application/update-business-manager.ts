import type { BusinessManager } from "../domain/entities";
import type { BusinessManagerRepository } from "../domain/repository";
import type { MetaApiClient } from "../domain/meta-api-client";
import type { UpdateBusinessManagerDto } from "./dto";

export class UpdateBusinessManager {
  constructor(
    private readonly repo: BusinessManagerRepository,
    private readonly metaApi: MetaApiClient
  ) {}

  async execute(
    id: string,
    userId: string,
    input: UpdateBusinessManagerDto
  ): Promise<BusinessManager> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new Error("Business Manager not found");
    }

    const updates: Partial<BusinessManager> = {};

    if (input.bmId !== undefined) updates.bmId = input.bmId;
    if (input.userToken !== undefined) updates.userToken = input.userToken;
    if (input.systemToken !== undefined)
      updates.systemToken = input.systemToken ?? null;
    if (input.appId !== undefined) updates.appId = input.appId;
    if (input.appSecret !== undefined) updates.appSecret = input.appSecret;
    if (input.autoRenew !== undefined) updates.autoRenew = input.autoRenew;

    // Re-fetch BM name if bmId or userToken changed
    const newBmId = input.bmId ?? existing.bmId;
    const newToken = input.userToken ?? existing.userToken;
    if (input.bmId !== undefined || input.userToken !== undefined) {
      updates.bmName = await this.metaApi
        .fetchBmName(newBmId, newToken)
        .catch(() => existing.bmName);
    }

    return this.repo.update(id, userId, updates);
  }
}
