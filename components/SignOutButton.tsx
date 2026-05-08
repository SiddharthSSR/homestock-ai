import { signOut } from "@/lib/auth/config";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-md border border-cocoa/15 bg-paper px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cocoa hover:bg-cream"
      >
        Sign out
      </button>
    </form>
  );
}
