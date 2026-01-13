import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import { getPrisma } from "@/lib/prisma";

// Create a lazy adapter proxy so we don't force PrismaClient construction
// at module evaluation time. The real adapter is created on first access.
function lazyPrismaAdapter() {
  let real: ReturnType<typeof PrismaAdapter> | null = null;
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (!real) real = PrismaAdapter(getPrisma());
        // @ts-ignore
        return (real as any)[prop];
      },
      apply(_, thisArg, args) {
        if (!real) real = PrismaAdapter(getPrisma());
        return (real as any).apply(thisArg, args);
      },
    }
  ) as any;
}

const ALLOWED_DOMAIN = "@opmobility.com";

const _authOptions = {
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
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = (token.name as string) ?? session.user.name;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  };

  const _nextAuth = NextAuth(_authOptions as any);

  // `_nextAuth` can be either a handler function or an object containing `handlers`.
  let handlers: any = _nextAuth;
  if (typeof _nextAuth !== "function" && _nextAuth && ("handlers" in _nextAuth || "handler" in _nextAuth)) {
    handlers = (_nextAuth as any).handlers ?? (_nextAuth as any).handler;
  }

  // Re-export any helper functions if available.
  const auth = (typeof _nextAuth === "object" && ( _nextAuth as any).auth) || undefined;
  const signIn = (typeof _nextAuth === "object" && ( _nextAuth as any).signIn) || undefined;
  const signOut = (typeof _nextAuth === "object" && ( _nextAuth as any).signOut) || undefined;

  export { auth, signIn, signOut };

  export default handlers;
