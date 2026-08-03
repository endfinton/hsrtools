import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { timingSafeEqual } from "crypto";
import type { Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "./src/db";
import { accounts, authenticators, sessions, userProfiles, users, verificationTokens } from "./src/db/schema";

function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function adminEmails() {
  return [process.env.ADMIN_EMAIL, ...(process.env.ADMIN_EMAILS?.split(",") ?? [])]
    .filter(Boolean)
    .map((email) => email!.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email?: string | null) {
  return Boolean(email && adminEmails().includes(email.toLowerCase()));
}

function displayName(name?: string | null, email?: string | null) {
  const value = (name || email?.split("@")[0] || "Trailblazer").trim();
  return value.slice(0, 80);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  providers: [
    Google,
    Credentials({
      id: "admin-credentials",
      name: "Admin",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize(credentials) {
        const username = typeof credentials?.username === "string" ? credentials.username : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        const adminUsername = process.env.ADMIN_USERNAME ?? "";
        const adminPassword = process.env.ADMIN_PASSWORD ?? "";

        if (adminUsername && adminPassword && safeEquals(username, adminUsername) && safeEquals(password, adminPassword)) {
          return { id: "admin-credentials", name: username, role: "admin" };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.id === "admin-credentials" || isAdminEmail(user.email) ? "admin" : "user";
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.sub === "string" ? token.sub : "";
        session.user.role = token.role === "admin" ? "admin" : "user";
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) {
        return;
      }

      const now = new Date();

      await db
        .insert(userProfiles)
        .values({
          userId: user.id,
          displayName: displayName(user.name, user.email),
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    },
  },
  pages: {
    signIn: "/login",
  },
});

export function canManageTierList(session: Session | null) {
  return session?.user?.role === "admin";
}
