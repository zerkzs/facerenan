import type { AuthRepository } from "../domain/repository";
import type { User } from "../domain/entities";
import { createSupabaseServerClient } from "./supabase-client";
import bcrypt from "bcryptjs";

interface UserRow {
  id: string;
  meta_id: string | null;
  name: string;
  email: string;
  image: string | null;
  created_at: string;
  updated_at: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    metaId: row.meta_id,
    name: row.name,
    email: row.email,
    image: row.image,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseAuthRepository implements AuthRepository {
  private get db() {
    return createSupabaseServerClient();
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.db
      .from("users")
      .select("*")
      .eq("email", email)
      .single<UserRow>();

    if (error?.code === "PGRST116") return null;
    if (error) throw new Error(`Failed to find user: ${error.message}`);

    return toUser(data);
  }

  async verifyCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    const { data, error } = await this.db
      .from("users")
      .select("*, password_hash")
      .eq("email", email)
      .single<UserRow & { password_hash: string | null }>();

    if (error?.code === "PGRST116") return null;
    if (error) throw new Error(`Failed to verify credentials: ${error.message}`);
    if (!data.password_hash) return null;

    const isValid = await bcrypt.compare(password, data.password_hash);
    if (!isValid) return null;

    return toUser(data);
  }

  async createUser(
    user: Omit<User, "id" | "createdAt" | "updatedAt"> & {
      passwordHash: string;
    }
  ): Promise<User> {
    const { data, error } = await this.db
      .from("users")
      .insert({
        name: user.name,
        email: user.email,
        image: user.image,
        meta_id: user.metaId,
        password_hash: user.passwordHash,
      })
      .select()
      .single<UserRow>();

    if (error) throw new Error(`Failed to create user: ${error.message}`);

    return toUser(data);
  }

  async updateUser(id: string, partial: Partial<User>): Promise<User> {
    const updates: Record<string, unknown> = {};
    if (partial.name !== undefined) updates.name = partial.name;
    if (partial.email !== undefined) updates.email = partial.email;
    if (partial.image !== undefined) updates.image = partial.image;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await this.db
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single<UserRow>();

    if (error) throw new Error(`Failed to update user: ${error.message}`);

    return toUser(data);
  }
}
