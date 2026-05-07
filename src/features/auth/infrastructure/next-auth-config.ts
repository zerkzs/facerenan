import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import { encryptToken, decryptToken } from "./token-encryption";
import { SupabaseAuthRepository } from "./supabase-auth-repository";
import { UpsertUserOnLogin } from "../application/upsert-user-on-login";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      metaId?: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    metaId?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Facebook({
      clientId: process.env.META_APP_ID!,
      clientSecret: process.env.META_APP_SECRET!,
      authorization: {
        params: {
          scope:
            "email,public_profile,ads_management,ads_read,business_management",
        },
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign-in: persist Meta tokens encrypted + upsert user in DB
      if (account && profile) {
        token.accessToken = account.access_token
          ? encryptToken(account.access_token)
          : undefined;
        token.refreshToken = account.refresh_token
          ? encryptToken(account.refresh_token)
          : undefined;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : undefined;
        token.metaId = (profile as { id?: string }).id;

        // Persist user and tokens in Supabase
        if (token.metaId && account.access_token) {
          try {
            const repo = new SupabaseAuthRepository();
            const useCase = new UpsertUserOnLogin(repo);
            const { user } = await useCase.execute({
              metaId: token.metaId,
              name: (profile as { name?: string }).name ?? "Unknown",
              email: (profile as { email?: string }).email ?? "",
              image: (profile as { picture?: { data?: { url?: string } } }).picture?.data?.url ?? null,
              tokens: {
                accessToken: account.access_token,
                refreshToken: account.refresh_token ?? "",
                expiresAt: new Date((account.expires_at ?? 0) * 1000),
              },
            });
            token.sub = user.id;
          } catch (err) {
            console.error("[auth] Failed to persist user on login:", err);
          }
        }
      }

      // Return token if it has not expired
      if (
        typeof token.accessTokenExpires === "number" &&
        Date.now() < token.accessTokenExpires
      ) {
        return token;
      }

      // Token expired — for now, return as-is (user will re-auth on API failure)
      return token;
    },

    async session({ session, token }) {
      if (typeof token.accessToken === "string") {
        session.accessToken = decryptToken(token.accessToken);
      }
      if (typeof token.metaId === "string") {
        session.user.metaId = token.metaId;
      }
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
