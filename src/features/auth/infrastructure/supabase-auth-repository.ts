import type { AuthRepository } from "../domain/repository";
import type { User } from "../domain/entities";
import type { MetaTokenPair } from "../domain/value-objects";
import { encryptToken, decryptToken } from "./token-encryption";
import { createSupabaseServerClient } from "./supabase-client";

interface UserRow {
  id: string;
  meta_id: string;
  name: string;
  email: string;
  image: string | null;
  created_at: string;
  updated_at: string;
}

interface TokenRow {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
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

  async findUserByMetaId(metaId: string): Promise<User | null> {
    const { data, error } = await this.db
      .from("users")
      .select("*")
      .eq("meta_id", metaId)
      .single<UserRow>();

    if (error?.code === "PGRST116") return null; // not found
    if (error) throw new Error(`Failed to find user: ${error.message}`);

    return toUser(data);
  }

  async createUser(
    user: Omit<User, "id" | "createdAt" | "updatedAt">
  ): Promise<User> {
    const { data, error } = await this.db
      .from("users")
      .insert({
        meta_id: user.metaId,
        name: user.name,
        email: user.email,
        image: user.image,
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

  async storeTokens(userId: string, tokens: MetaTokenPair): Promise<void> {
    const encrypted = {
      user_id: userId,
      access_token: encryptToken(tokens.accessToken),
      refresh_token: encryptToken(tokens.refreshToken),
      expires_at: tokens.expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.db
      .from("user_tokens")
      .upsert(encrypted, { onConflict: "user_id" });

    if (error) throw new Error(`Failed to store tokens: ${error.message}`);
  }

  async getTokens(userId: string): Promise<MetaTokenPair | null> {
    const { data, error } = await this.db
      .from("user_tokens")
      .select("*")
      .eq("user_id", userId)
      .single<TokenRow>();

    if (error?.code === "PGRST116") return null;
    if (error) throw new Error(`Failed to get tokens: ${error.message}`);

    return {
      accessToken: decryptToken(data.access_token),
      refreshToken: decryptToken(data.refresh_token),
      expiresAt: new Date(data.expires_at),
    };
  }
}
