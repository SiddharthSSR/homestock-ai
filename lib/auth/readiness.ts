// Pure helpers used by lib/auth/config.ts. Kept separate so unit tests don't
// have to import NextAuth's runtime (which transitively pulls next/server and
// breaks vitest's ESM resolution).

export type AuthEnv = Record<string, string | undefined>;

export type AuthReadiness = {
  demoMode: boolean;
  hasSecret: boolean;
  hasEmailProvider: boolean;
  devLog: boolean;
  isConfigured: boolean;
};

export function computeAuthReadiness(env: AuthEnv, demoMode: boolean): AuthReadiness {
  const hasSecret = Boolean(env.AUTH_SECRET);
  const hasEmailProvider = Boolean(env.EMAIL_SERVER && env.EMAIL_FROM);
  const devLog = env.AUTH_DEV_LOG_MAGIC_LINK === "true";
  const providerRegistered = hasEmailProvider || devLog;
  return {
    demoMode,
    hasSecret,
    hasEmailProvider,
    devLog,
    isConfigured: providerRegistered && hasSecret
  };
}

export type VerificationRequestArgs = { identifier: string; url: string };

export function devLogVerificationRequest({ identifier, url }: VerificationRequestArgs) {
  // Single-line prefix so logs are greppable. Only invoked when
  // AUTH_DEV_LOG_MAGIC_LINK=true; never logs from any other path.
  console.log(`[auth] magic-link for ${identifier}: ${url}`);
}
