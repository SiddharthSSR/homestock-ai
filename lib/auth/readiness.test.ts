import { afterEach, describe, expect, it, vi } from "vitest";
import { computeAuthReadiness, devLogVerificationRequest } from "./readiness";

describe("computeAuthReadiness", () => {
  it("returns not configured in demo mode regardless of other env", () => {
    expect(
      computeAuthReadiness(
        { AUTH_SECRET: "secret", EMAIL_SERVER: "smtp://x", EMAIL_FROM: "a@b" },
        true
      )
    ).toEqual({
      demoMode: true,
      hasSecret: true,
      hasEmailProvider: true,
      devLog: false,
      isConfigured: true
    });
  });

  it("non-demo + SMTP + secret = configured, devLog false", () => {
    expect(
      computeAuthReadiness(
        { AUTH_SECRET: "secret", EMAIL_SERVER: "smtp://localhost:1025", EMAIL_FROM: "auth@local" },
        false
      )
    ).toEqual({
      demoMode: false,
      hasSecret: true,
      hasEmailProvider: true,
      devLog: false,
      isConfigured: true
    });
  });

  it("non-demo + AUTH_DEV_LOG_MAGIC_LINK=true + secret = configured, devLog true", () => {
    expect(
      computeAuthReadiness({ AUTH_SECRET: "secret", AUTH_DEV_LOG_MAGIC_LINK: "true" }, false)
    ).toEqual({
      demoMode: false,
      hasSecret: true,
      hasEmailProvider: false,
      devLog: true,
      isConfigured: true
    });
  });

  it("non-demo + only AUTH_SECRET = not configured", () => {
    expect(computeAuthReadiness({ AUTH_SECRET: "secret" }, false)).toEqual({
      demoMode: false,
      hasSecret: true,
      hasEmailProvider: false,
      devLog: false,
      isConfigured: false
    });
  });

  it("non-demo + SMTP without AUTH_SECRET = not configured", () => {
    expect(
      computeAuthReadiness({ EMAIL_SERVER: "smtp://x", EMAIL_FROM: "a@b" }, false)
    ).toEqual({
      demoMode: false,
      hasSecret: false,
      hasEmailProvider: true,
      devLog: false,
      isConfigured: false
    });
  });

  it("treats AUTH_DEV_LOG_MAGIC_LINK other than literal 'true' as off", () => {
    expect(computeAuthReadiness({ AUTH_SECRET: "s", AUTH_DEV_LOG_MAGIC_LINK: "1" }, false).devLog).toBe(
      false
    );
    expect(
      computeAuthReadiness({ AUTH_SECRET: "s", AUTH_DEV_LOG_MAGIC_LINK: "TRUE" }, false).devLog
    ).toBe(false);
  });

  it("treats partial SMTP config (only server, no from) as no provider", () => {
    expect(
      computeAuthReadiness({ AUTH_SECRET: "s", EMAIL_SERVER: "smtp://x" }, false).hasEmailProvider
    ).toBe(false);
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
    expect(() =>
      devLogVerificationRequest({ identifier: "x@y.io", url: "" })
    ).not.toThrow();
  });
});
