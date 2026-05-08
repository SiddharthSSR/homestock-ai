import NextAuth, { type NextAuthConfig } from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isDemoModeEnabled } from "@/lib/household-selection";
import {
  computeAuthReadiness,
  devLogVerificationRequest,
  type AuthReadiness
} from "@/lib/auth/readiness";

export { devLogVerificationRequest, type AuthReadiness } from "@/lib/auth/readiness";

// Auth scaffolding. Demo mode behaves exactly as before: NextAuth is registered
// so /api/auth/* doesn't 404, but no provider is wired and getCurrentActor()
// short-circuits to actorId resolution.
//
// Non-demo mode supports two email-provider paths:
//
// 1. Real SMTP. Set EMAIL_SERVER + EMAIL_FROM and the provider routes through
//    Nodemailer as usual. Recommended for any deployed environment.
//
// 2. Dev-log magic link (LOCAL ONLY). Set AUTH_DEV_LOG_MAGIC_LINK=true and
//    sign-in URLs are written to the server stdout instead of being mailed.
//    Registers the Nodemailer provider with a placeholder server so Auth.js
//    treats auth as configured. The dev pastes the URL from the terminal into
//    a browser.
//
// AUTH_DEV_LOG_MAGIC_LINK MUST remain unset in any deployed environment. The
// runbook in docs/non-demo-auth-smoke.md walks through the only intended use.

const emailServer = process.env.EMAIL_SERVER;
const emailFrom = process.env.EMAIL_FROM;
const devLogMagicLink = process.env.AUTH_DEV_LOG_MAGIC_LINK === "true";

const hasSmtp = Boolean(emailServer && emailFrom);

const providers: NextAuthConfig["providers"] = [];
if (hasSmtp || devLogMagicLink) {
  providers.push(
    Nodemailer({
      server: emailServer ?? "smtp://localhost:25",
      from: emailFrom ?? "auth@homestock.local",
      ...(devLogMagicLink ? { sendVerificationRequest: devLogVerificationRequest } : {})
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

export function authReadinessStatus(): AuthReadiness {
  return computeAuthReadiness(process.env, isDemoModeEnabled());
}
