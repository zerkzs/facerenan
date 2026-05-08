import type { MetaApiClient } from "../domain/meta-api-client";
import type { BusinessUserRole, InviteResult } from "../domain/value-objects";

export type { MetaApiClient };

export class MetaGraphApiClient implements MetaApiClient {
  private readonly baseUrl: string;

  constructor() {
    const version = process.env.META_API_VERSION ?? "v25.0";
    this.baseUrl = `https://graph.facebook.com/${version}`;
  }

  async fetchBmName(
    bmId: string,
    accessToken: string
  ): Promise<string | null> {
    const url = new URL(`${this.baseUrl}/${encodeURIComponent(bmId)}`);
    url.searchParams.set("fields", "name");
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = (await res.json()) as { name?: string };
    return data.name ?? null;
  }

  async exchangeForLongLivedToken(
    shortToken: string,
    appId: string,
    appSecret: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const url = new URL(`${this.baseUrl}/oauth/access_token`);
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("fb_exchange_token", shortToken);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      const message =
        body?.error?.message ?? `Token exchange failed (HTTP ${res.status})`;
      throw new Error(message);
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  async inviteBusinessUser(
    businessId: string,
    email: string,
    role: BusinessUserRole,
    accessToken: string
  ): Promise<InviteResult> {
    const url = new URL(
      `${this.baseUrl}/${encodeURIComponent(businessId)}/business_users`
    );

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        role,
        access_token: accessToken,
      }),
    });

    if (res.ok) {
      return { email, status: "success", message: `Invite sent to ${email}` };
    }

    const body = (await res.json().catch(() => null)) as {
      error?: { message?: string; code?: number; error_subcode?: number };
    } | null;

    const errorMsg = body?.error?.message ?? "";
    const errorCode = body?.error?.code;
    const errorSubcode = body?.error?.error_subcode;

    // Code 368 or subcode 1487171 = already a member
    if (errorCode === 368 || errorSubcode === 1487171 || errorMsg.includes("already")) {
      return { email, status: "already_member", message: "Already a member of this BM" };
    }

    // Code 190 = invalid/expired token
    if (errorCode === 190) {
      return { email, status: "error", message: "Invalid or expired token" };
    }

    // Code 10 or 200 = permission denied
    if (errorCode === 10 || errorCode === 200) {
      return {
        email,
        status: "error",
        message: "Token does not have business_management permission",
      };
    }

    return {
      email,
      status: "error",
      message: errorMsg || `Invite failed (HTTP ${res.status})`,
    };
  }
}
