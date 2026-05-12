import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { SupabaseAuthRepository } from "./supabase-auth-repository";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const repo = new SupabaseAuthRepository();
        const user = await repo.verifyCredentials(email, password);
        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
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
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
