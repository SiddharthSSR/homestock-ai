import NextAuth, { type NextAuthConfig } from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isDemoModeEnabled } from "@/lib/household-selection";

// Phase 1 auth scaffolding. Auth is configured but not yet enforced on
// existing API routes. Demo mode behaves exactly as before.
//
// In demo mode we still register NextAuth so the /api/auth/* routes don't
// 404, but no email provider is wired up, sign-in attempts will short-circuit,
// and getCurrentActor() never calls auth() (see lib/auth/current-actor.ts).
//
// In non-demo mode we require AUTH_SECRET to be set and a Nodemailer SMTP
// connection string in EMAIL_SERVER. If the SMTP creds are missing the
// provider list is empty and the sign-in page surfaces the misconfiguration
// instead of crashing the request.

const emailServer = process.env.EMAIL_SERVER;
const emailFrom = process.env.EMAIL_FROM;

const providers: NextAuthConfig["providers"] = [];
if (emailServer && emailFrom) {
  providers.push(
    Nodemailer({
      server: emailServer,
      from: emailFrom
    })
  );
}

export const isAuthConfigured = providers.length > 0 && Boolean(process.env.AUTH_SECRET);

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "database" },
  pages: { signIn: "/sign-in" },
  callbacks: {
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    }
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export function authReadinessStatus() {
  return {
    demoMode: isDemoModeEnabled(),
    hasSecret: Boolean(process.env.AUTH_SECRET),
    hasEmailProvider: Boolean(emailServer && emailFrom),
    isConfigured: isAuthConfigured
  };
}
