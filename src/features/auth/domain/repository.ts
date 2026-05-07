import type { User } from "./entities";
import type { MetaTokenPair } from "./value-objects";

export interface AuthRepository {
  findUserByMetaId(metaId: string): Promise<User | null>;
  createUser(
    user: Omit<User, "id" | "createdAt" | "updatedAt">
  ): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  storeTokens(userId: string, tokens: MetaTokenPair): Promise<void>;
  getTokens(userId: string): Promise<MetaTokenPair | null>;
}
