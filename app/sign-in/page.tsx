import { PageHeader } from "@/components/PageHeader";
import { isDemoModeEnabled } from "@/lib/household-selection";
import { authReadinessStatus, signIn } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

async function emailSignInAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  // Auth.js exposes Resend with id "resend" and Nodemailer with id "nodemailer".
  // The dev-log path uses Nodemailer with an overridden sendVerificationRequest.
  const provider = String(formData.get("provider") ?? "nodemailer");
  await signIn(provider, { email, redirectTo: "/" });
}

export default function SignInPage() {
  const status = authReadinessStatus();
  const demo = isDemoModeEnabled();

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Auth readiness"
        title="Sign in"
        meta="Phase 1"
        description="HomeStock AI is moving from demo actor switching to real authentication. This page is the entry point for non-demo deployments."
      />

      {demo ? (
        <section className="rounded-xl border border-cocoa/10 bg-cream p-5 shadow-panel">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cocoa/60">Demo mode</p>
          <h2 className="mt-1 font-serif text-2xl text-cocoa">Sign-in is not used in the hosted demo</h2>
          <p className="mt-2 text-sm text-bark">
            The hosted demo uses seeded QA households and the actor switcher. Real sign-in is wired up but disabled here so the demo flow is unchanged.
          </p>
        </section>
      ) : status.unsafeProductionDevLog ? (
        <section className="rounded-xl border border-peachDeep/60 bg-peach/50 p-5 shadow-panel">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cocoa/80">Unsafe configuration</p>
          <h2 className="mt-1 font-serif text-2xl text-cocoa">Dev-log magic-link is disabled in production</h2>
          <p className="mt-2 text-sm text-bark">
            <code>AUTH_DEV_LOG_MAGIC_LINK</code> is set to <code>true</code> on a production build. This flag is intended for local smoke testing only and is ignored here so magic links are not written to server logs.
          </p>
          <p className="mt-2 text-sm text-bark">
            Configure a real email provider — set <code>AUTH_RESEND_KEY</code> and <code>AUTH_EMAIL_FROM</code> (or SMTP via <code>EMAIL_SERVER</code>/<code>EMAIL_FROM</code>) — and remove <code>AUTH_DEV_LOG_MAGIC_LINK</code> from the deployment env.
          </p>
        </section>
      ) : status.isConfigured ? (
        <section className="rounded-xl border border-cocoa/10 bg-paper p-5 shadow-panel">
          <h2 className="font-serif text-2xl text-cocoa">Magic-link sign-in</h2>
          <p className="mt-2 text-sm text-bark">
            Enter your email and we will send a one-time sign-in link. Your email must already be linked to a household by an admin.
            {status.provider === "dev-log" ? (
              <>
                {" "}
                <span className="font-semibold">Local dev-log mode:</span> the link will be written to the server console instead of mailed.
              </>
            ) : null}
          </p>
          <form action={emailSignInAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="provider" value={status.provider === "resend" ? "resend" : "nodemailer"} />
            <label className="grid gap-1 text-sm text-cocoa">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-bark">Email</span>
              <input
                required
                type="email"
                name="email"
                placeholder="you@example.com"
                className="rounded-md border border-cocoa/20 bg-paper px-3 py-2 text-sm focus:border-forest focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="inline-flex rounded-md bg-forest px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-paper hover:bg-cocoa"
            >
              Send sign-in link
            </button>
          </form>
          <p className="mt-3 text-xs text-bark/75">Provider: {status.provider}</p>
        </section>
      ) : (
        <section className="rounded-xl border border-peachDeep/40 bg-peach/40 p-5 shadow-panel">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cocoa/70">Auth not configured</p>
          <h2 className="mt-1 font-serif text-2xl text-cocoa">Sign-in is unavailable in this environment</h2>
          <p className="mt-2 text-sm text-bark">
            Set <code>AUTH_SECRET</code> plus one of: <code>AUTH_RESEND_KEY</code>+<code>AUTH_EMAIL_FROM</code> (production) or <code>EMAIL_SERVER</code>+<code>EMAIL_FROM</code> (legacy SMTP). For local smoke testing, set <code>AUTH_DEV_LOG_MAGIC_LINK=true</code>. See <code>docs/auth-readiness.md</code>.
          </p>
        </section>
      )}
    </div>
  );
}
