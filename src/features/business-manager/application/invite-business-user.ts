import type { BusinessManagerRepository } from "../domain/repository";
import type { MetaApiClient } from "../domain/meta-api-client";
import type { BusinessUserRole, InviteResult } from "../domain/value-objects";

export class InviteBusinessUser {
  constructor(
    private readonly repo: BusinessManagerRepository,
    private readonly metaApi: MetaApiClient
  ) {}

  async execute(
    bmId: string,
    userId: string,
    email: string,
    role: BusinessUserRole
  ): Promise<InviteResult> {
    const bm = await this.repo.findById(bmId, userId);
    if (!bm) {
      throw new Error("Business Manager not found");
    }

    return this.metaApi.inviteBusinessUser(
      bm.bmId,
      email,
      role,
      bm.userToken
    );
  }
}
