import type { User } from "./entities";

export interface AuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  verifyCredentials(email: string, password: string): Promise<User | null>;
  createUser(
    user: Omit<User, "id" | "createdAt" | "updatedAt"> & {
      passwordHash: string;
    }
  ): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
}
