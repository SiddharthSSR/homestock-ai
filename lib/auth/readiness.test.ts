import { afterEach, describe, expect, it, vi } from "vitest";
import { computeAuthReadiness, devLogVerificationRequest } from "./readiness";

const baseSecret = { AUTH_SECRET: "secret" };
const resendVars = { AUTH_RESEND_KEY: "re_xxx", AUTH_EMAIL_FROM: "auth@homestock.app" };
const smtpVars = { EMAIL_SERVER: "smtp://localhost:1025", EMAIL_FROM: "auth@local" };

describe("computeAuthReadiness — demo mode", () => {
  it("never selects a provider in demo mode regardless of other env", () => {
    const r = computeAuthReadiness({ ...baseSecret, ...resendVars, ...smtpVars }, true);
    expect(r.provider).toBe("none");
    expect(r.isConfigured).toBe(false);
    expect(r.demoMode).toBe(true);
  });
});

describe("computeAuthReadiness — Resend tier", () => {
  it("selects resend when AUTH_RESEND_KEY + AUTH_EMAIL_FROM + AUTH_SECRET are set", () => {
    const r = computeAuthReadiness({ ...baseSecret, ...resendVars }, false);
    expect(r.provider).toBe("resend");
    expect(r.isConfigured).toBe(true);
    expect(r.devLog).toBe(false);
    expect(r.unsafeProductionDevLog).toBe(false);
  });

  it("not configured when AUTH_RESEND_KEY is set but AUTH_SECRET is missing", () => {
    const r = computeAuthReadiness({ ...resendVars }, false);
    expect(r.provider).toBe("none");
    expect(r.isConfigured).toBe(false);
  });

  it("not configured when AUTH_EMAIL_FROM is missing (key alone is not enough)", () => {
    const r = computeAuthReadiness({ ...baseSecret, AUTH_RESEND_KEY: "re_xxx" }, false);
    expect(r.provider).toBe("none");
    expect(r.isConfigured).toBe(false);
  });

  it("Resend wins over dev-log when both are configured", () => {
    const r = computeAuthReadiness(
      { ...baseSecret, ...resendVars, AUTH_DEV_LOG_MAGIC_LINK: "true" },
      false
    );
    expect(r.provider).toBe("resend");
    expect(r.devLog).toBe(false);
  });

  it("Resend wins over SMTP when both are configured", () => {
    const r = computeAuthReadiness({ ...baseSecret, ...resendVars, ...smtpVars }, false);
    expect(r.provider).toBe("resend");
  });
});

describe("computeAuthReadiness — dev-log tier", () => {
  it("selects dev-log in non-production when AUTH_DEV_LOG_MAGIC_LINK=true and AUTH_SECRET set", () => {
    const r = computeAuthReadiness(
      { ...baseSecret, AUTH_DEV_LOG_MAGIC_LINK: "true", NODE_ENV: "development" },
      false
    );
    expect(r.provider).toBe("dev-log");
    expect(r.devLog).toBe(true);
    expect(r.isConfigured).toBe(true);
    expect(r.unsafeProductionDevLog).toBe(false);
  });

  it("does not enable dev-log in production even when the flag is set", () => {
    const r = computeAuthReadiness(
      { ...baseSecret, AUTH_DEV_LOG_MAGIC_LINK: "true", NODE_ENV: "production" },
      false
    );
    expect(r.provider).toBe("none");
    expect(r.devLog).toBe(false);
    expect(r.isConfigured).toBe(false);
    expect(r.unsafeProductionDevLog).toBe(true);
  });

  it("does not enable dev-log in production but still allows other providers to take over", () => {
    const r = computeAuthReadiness(
      { ...baseSecret, ...smtpVars, AUTH_DEV_LOG_MAGIC_LINK: "true", NODE_ENV: "production" },
      false
    );
    // Dev-log is blocked, but SMTP is independently valid and wins by priority.
    // The unsafeProductionDevLog flag still fires so the UI can warn and hide
    // the sign-in form regardless of which provider technically resolved.
    expect(r.provider).toBe("smtp");
    expect(r.devLog).toBe(false);
    expect(r.unsafeProductionDevLog).toBe(true);
  });

  it("blocks dev-log + warns when no other provider is configured in production", () => {
    const r = computeAuthReadiness(
      { ...baseSecret, AUTH_DEV_LOG_MAGIC_LINK: "true", NODE_ENV: "production" },
      false
    );
    expect(r.provider).toBe("none");
    expect(r.devLog).toBe(false);
    expect(r.isConfigured).toBe(false);
    expect(r.unsafeProductionDevLog).toBe(true);
  });

  it("treats AUTH_DEV_LOG_MAGIC_LINK other than literal 'true' as off", () => {
    const r1 = computeAuthReadiness({ ...baseSecret, AUTH_DEV_LOG_MAGIC_LINK: "1" }, false);
    expect(r1.provider).toBe("none");
    expect(r1.devLog).toBe(false);
    const r2 = computeAuthReadiness({ ...baseSecret, AUTH_DEV_LOG_MAGIC_LINK: "TRUE" }, false);
    expect(r2.provider).toBe("none");
    expect(r2.devLog).toBe(false);
  });
});

describe("computeAuthReadiness — SMTP tier", () => {
  it("selects smtp when EMAIL_SERVER + EMAIL_FROM + AUTH_SECRET are set and Resend is absent", () => {
    const r = computeAuthReadiness({ ...baseSecret, ...smtpVars }, false);
    expect(r.provider).toBe("smtp");
    expect(r.isConfigured).toBe(true);
  });

  it("dev-log wins over SMTP when both are set", () => {
    const r = computeAuthReadiness(
      { ...baseSecret, ...smtpVars, AUTH_DEV_LOG_MAGIC_LINK: "true", NODE_ENV: "development" },
      false
    );
    expect(r.provider).toBe("dev-log");
  });

  it("partial SMTP (only server) leaves provider unconfigured", () => {
    const r = computeAuthReadiness({ ...baseSecret, EMAIL_SERVER: "smtp://x" }, false);
    expect(r.provider).toBe("none");
    expect(r.isConfigured).toBe(false);
  });
});

describe("computeAuthReadiness — none / misconfigured", () => {
  it("only AUTH_SECRET = none", () => {
    const r = computeAuthReadiness({ ...baseSecret }, false);
    expect(r.provider).toBe("none");
    expect(r.isConfigured).toBe(false);
  });

  it("provider env without AUTH_SECRET = none", () => {
    expect(computeAuthReadiness({ ...resendVars }, false).provider).toBe("none");
    expect(computeAuthReadiness({ ...smtpVars }, false).provider).toBe("none");
    expect(
      computeAuthReadiness({ AUTH_DEV_LOG_MAGIC_LINK: "true", NODE_ENV: "development" }, false)
        .provider
    ).toBe("none");
  });

  it("empty env = none", () => {
    expect(computeAuthReadiness({}, false)).toEqual({
      demoMode: false,
      hasSecret: false,
      provider: "none",
      hasEmailProvider: false,
      devLog: false,
      unsafeProductionDevLog: false,
      isConfigured: false
    });
  });
});

describe("devLogVerificationRequest", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  afterEach(() => {
    logSpy.mockClear();
  });

  it("logs exactly one line containing the email and url", () => {
    devLogVerificationRequest({
      identifier: "smoke@example.com",
      url: "http://localhost:3000/api/auth/callback/nodemailer?token=abc"
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const message = logSpy.mock.calls[0][0] as string;
    expect(message).toContain("smoke@example.com");
    expect(message).toContain("http://localhost:3000/api/auth/callback/nodemailer?token=abc");
    expect(message).toMatch(/^\[auth\] magic-link for /);
  });

  it("does not throw on unusual identifier or url shapes", () => {
    expect(() => devLogVerificationRequest({ identifier: "x@y.io", url: "" })).not.toThrow();
  });
});
