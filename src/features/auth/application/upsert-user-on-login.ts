import type { AuthRepository } from "../domain/repository";
import type { User } from "../domain/entities";

export interface UpsertUserOnLoginInput {
  name: string;
  email: string;
  image: string | null;
  passwordHash: string;
}

export interface UpsertUserOnLoginOutput {
  user: User;
  isNewUser: boolean;
}

export class UpsertUserOnLogin {
  constructor(private readonly repo: AuthRepository) {}

  async execute(input: UpsertUserOnLoginInput): Promise<UpsertUserOnLoginOutput> {
    const existing = await this.repo.findUserByEmail(input.email);

    if (existing) {
      return { user: existing, isNewUser: false };
    }

    const user = await this.repo.createUser({
      name: input.name,
      email: input.email,
      image: input.image,
      metaId: null,
      passwordHash: input.passwordHash,
    });

    return { user, isNewUser: true };
  }
}
