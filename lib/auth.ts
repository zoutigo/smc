import type { NextAuthOptions, Session, User } from "next-auth";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { JWT } from "next-auth/jwt";

import { getPrisma } from "@/lib/prisma";

// Create a lazy adapter proxy so we don't force PrismaClient construction
// at module evaluation time. The real adapter is created on first access.
function lazyPrismaAdapter(): ReturnType<typeof PrismaAdapter> {
  let real: ReturnType<typeof PrismaAdapter> | null = null;
  return new Proxy({} as ReturnType<typeof PrismaAdapter>, {
    get(_target, prop: keyof ReturnType<typeof PrismaAdapter>) {
      if (!real) real = PrismaAdapter(getPrisma());
      const key = prop as keyof ReturnType<typeof PrismaAdapter>;
      return real[key];
    },
    apply(_target, thisArg, argArray) {
      if (!real) real = PrismaAdapter(getPrisma());
      return (real as (...args: unknown[]) => unknown).apply(thisArg, argArray as unknown[]);
    },
  });
}

const ALLOWED_DOMAIN = "@opmobility.com";

export const authOptions: NextAuthOptions = {
  adapter: lazyPrismaAdapter(),
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = creds?.email?.toLowerCase().trim();
        const password = creds?.password ?? "";

        if (!email || !password) return null;
        if (!email.endsWith(ALLOWED_DOMAIN)) return null;

        const prisma = getPrisma();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const passwordValid = await compare(password, user.passwordHash);
        if (!passwordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }: { token: JWT; user?: User | null }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name ?? user.email;
      }
      return token;
    },
    session: async ({ session, token }: { session: Session; token: JWT }) => {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.email = (token.email as string | null | undefined) ?? session.user.email;
        session.user.name = (token.name as string | null | undefined) ?? session.user.name;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
};

const _nextAuth = NextAuth(authOptions);

// `_nextAuth` can be either a handler function or an object containing `handlers`.
let handlers: unknown = _nextAuth;
if (
  typeof _nextAuth !== "function" &&
  _nextAuth &&
  ("handlers" in _nextAuth || "handler" in _nextAuth)
) {
  handlers =
    (_nextAuth as { handlers?: unknown; handler?: unknown }).handlers ??
    (_nextAuth as { handlers?: unknown; handler?: unknown }).handler;
}

// Re-export any helper functions if available.
type NextAuthHelpers = {
  auth?: (...args: unknown[]) => unknown;
  signIn?: (...args: unknown[]) => unknown;
  signOut?: (...args: unknown[]) => unknown;
};

export const auth: NextAuthHelpers["auth"] =
  typeof _nextAuth === "object" && (_nextAuth as NextAuthHelpers).auth
    ? (_nextAuth as NextAuthHelpers).auth
    : undefined;
export const signIn: NextAuthHelpers["signIn"] =
  typeof _nextAuth === "object" && (_nextAuth as NextAuthHelpers).signIn
    ? (_nextAuth as NextAuthHelpers).signIn
    : undefined;
export const signOut: NextAuthHelpers["signOut"] =
  typeof _nextAuth === "object" && (_nextAuth as NextAuthHelpers).signOut
    ? (_nextAuth as NextAuthHelpers).signOut
    : undefined;

export default handlers;
