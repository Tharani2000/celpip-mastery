import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";

const credentials = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(128) });

let dummy: string | null = null;
/** Constant-time-ish path for unknown emails so response timing doesn’t reveal which accounts exist. */
const dummyHash = () => (dummy ??= bcrypt.hashSync("not-a-real-password", 10));

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(raw) {
        const parsed = credentials.safeParse(raw);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) { await bcrypt.compare(parsed.data.password, dummyHash()); return null; }
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        return ok ? { id: user.id, email: user.email, name: user.name } : null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.uid = user.id; return token; },
    async session({ session, token }) { if (session.user && token.uid) (session.user as { id?: string }).id = token.uid as string; return session; }
  }
};

export class AuthError extends Error { status = 401; }

/** Returns the signed-in user's id or throws AuthError. Every data access is scoped to this id. */
export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) throw new AuthError("Not signed in");
  return id;
}
export async function optionalUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return ((session?.user as { id?: string } | undefined)?.id) ?? null;
}
