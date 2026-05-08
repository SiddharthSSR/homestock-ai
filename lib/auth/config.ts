import NextAuth, { type NextAuthConfig } from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isDemoModeEnabled } from "@/lib/household-selection";
import {
  computeAuthReadiness,
  devLogVerificationRequest,
  type AuthReadiness
} from "@/lib/auth/readiness";

export { devLogVerificationRequest, type AuthReadiness } from "@/lib/auth/readiness";

// Auth provider selection. See lib/auth/readiness.ts for the priority rules.
//
// Demo mode keeps NextAuth registered so /api/auth/* doesn't 404, but no
// provider is wired up; `getCurrentActor()` short-circuits to actorId
// resolution and `/sign-in` shows the demo notice.
//
// Non-demo deployments should set AUTH_RESEND_KEY + AUTH_EMAIL_FROM for the
// Resend provider, plus AUTH_SECRET. See docs/auth-readiness.md.
//
// AUTH_DEV_LOG_MAGIC_LINK=true is intended for local smoke testing only; it is
// disabled when NODE_ENV === "production" and `unsafeProductionDevLog` is
// surfaced via authReadinessStatus() so /sign-in can warn.

const readiness = computeAuthReadiness(process.env, isDemoModeEnabled());

const providers: NextAuthConfig["providers"] = [];
if (readiness.provider === "resend") {
  providers.push(
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY!,
      from: process.env.AUTH_EMAIL_FROM!
    })
  );
} else if (readiness.provider === "dev-log") {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER ?? "smtp://localhost:25",
      from: process.env.EMAIL_FROM ?? "auth@homestock.local",
      sendVerificationRequest: devLogVerificationRequest
    })
  );
} else if (readiness.provider === "smtp") {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!
    })
  );
}

export const isAuthConfigured = readiness.isConfigured;

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
