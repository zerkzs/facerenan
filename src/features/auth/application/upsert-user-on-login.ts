import type { AuthRepository } from "../domain/repository";
import type { User } from "../domain/entities";
import type { MetaTokenPair } from "../domain/value-objects";

export interface UpsertUserOnLoginInput {
  metaId: string;
  name: string;
  email: string;
  image: string | null;
  tokens: MetaTokenPair;
}

export interface UpsertUserOnLoginOutput {
  user: User;
  isNewUser: boolean;
}

export class UpsertUserOnLogin {
  constructor(private readonly repo: AuthRepository) {}

  async execute(input: UpsertUserOnLoginInput): Promise<UpsertUserOnLoginOutput> {
    const existing = await this.repo.findUserByMetaId(input.metaId);

    let user: User;
    let isNewUser: boolean;

    if (existing) {
      user = await this.repo.updateUser(existing.id, {
        name: input.name,
        email: input.email,
        image: input.image,
      });
      isNewUser = false;
    } else {
      user = await this.repo.createUser({
        metaId: input.metaId,
        name: input.name,
        email: input.email,
        image: input.image,
      });
      isNewUser = true;
    }

    await this.repo.storeTokens(user.id, input.tokens);

    return { user, isNewUser };
  }
}
