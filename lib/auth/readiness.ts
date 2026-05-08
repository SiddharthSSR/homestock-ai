// Pure helpers used by lib/auth/config.ts. Kept separate so unit tests don't
// have to import NextAuth's runtime (which transitively pulls next/server and
// breaks vitest's ESM resolution).

export type AuthEnv = Record<string, string | undefined>;

export type AuthProvider = "resend" | "smtp" | "dev-log" | "none";

export type AuthReadiness = {
  demoMode: boolean;
  hasSecret: boolean;
  provider: AuthProvider;
  hasEmailProvider: boolean;
  devLog: boolean;
  unsafeProductionDevLog: boolean;
  isConfigured: boolean;
};

// Provider priority (highest first), evaluated only in non-demo mode:
//   1. resend   — AUTH_RESEND_KEY + AUTH_EMAIL_FROM + AUTH_SECRET.
//   2. dev-log  — AUTH_DEV_LOG_MAGIC_LINK=true + AUTH_SECRET, NODE_ENV != production.
//   3. smtp     — EMAIL_SERVER + EMAIL_FROM + AUTH_SECRET (legacy fallback).
//   4. none     — anything else.
//
// Each tier requires AUTH_SECRET; without it Auth.js refuses to issue sessions.
//
// Production safety: AUTH_DEV_LOG_MAGIC_LINK=true is silently ignored when
// NODE_ENV === "production". The flag itself is reported via
// unsafeProductionDevLog so the sign-in page can warn loudly. We do NOT fall
// through to Resend or SMTP in that case — operators should fix the env first.
export function computeAuthReadiness(env: AuthEnv, demoMode: boolean): AuthReadiness {
  const hasSecret = Boolean(env.AUTH_SECRET);
  const hasResend = Boolean(env.AUTH_RESEND_KEY && env.AUTH_EMAIL_FROM);
  const hasSmtp = Boolean(env.EMAIL_SERVER && env.EMAIL_FROM);
  const devLogRequested = env.AUTH_DEV_LOG_MAGIC_LINK === "true";
  const isProduction = env.NODE_ENV === "production";
  const unsafeProductionDevLog = devLogRequested && isProduction;
  const devLogActive = devLogRequested && !isProduction;

  let provider: AuthProvider = "none";
  if (!demoMode && hasSecret) {
    if (hasResend) provider = "resend";
    else if (devLogActive) provider = "dev-log";
    else if (hasSmtp) provider = "smtp";
  }

  return {
    demoMode,
    hasSecret,
    provider,
    hasEmailProvider: hasResend || hasSmtp,
    devLog: provider === "dev-log",
    unsafeProductionDevLog,
    isConfigured: provider !== "none"
  };
}

export type VerificationRequestArgs = { identifier: string; url: string };

export function devLogVerificationRequest({ identifier, url }: VerificationRequestArgs) {
  // Single-line prefix so logs are greppable. Only invoked when the dev-log
  // provider is active, which `computeAuthReadiness` blocks in production.
  console.log(`[auth] magic-link for ${identifier}: ${url}`);
}
