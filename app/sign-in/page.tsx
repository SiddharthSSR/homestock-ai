import { PageHeader } from "@/components/PageHeader";
import { isDemoModeEnabled } from "@/lib/household-selection";
import { authReadinessStatus, signIn } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

async function emailSignInAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  await signIn("nodemailer", { email, redirectTo: "/" });
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
      ) : status.isConfigured ? (
        <section className="rounded-xl border border-cocoa/10 bg-paper p-5 shadow-panel">
          <h2 className="font-serif text-2xl text-cocoa">Magic-link sign-in</h2>
          <p className="mt-2 text-sm text-bark">
            Enter your email and we will send a one-time sign-in link. Your email must already be linked to a household by an admin.
          </p>
          <form action={emailSignInAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
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
        </section>
      ) : (
        <section className="rounded-xl border border-peachDeep/40 bg-peach/40 p-5 shadow-panel">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cocoa/70">Auth not configured</p>
          <h2 className="mt-1 font-serif text-2xl text-cocoa">Sign-in is unavailable in this environment</h2>
          <p className="mt-2 text-sm text-bark">
            Set <code>AUTH_SECRET</code>, <code>EMAIL_SERVER</code>, and <code>EMAIL_FROM</code> to enable magic-link sign-in. See <code>docs/auth-readiness.md</code>.
          </p>
        </section>
      )}
    </div>
  );
}
