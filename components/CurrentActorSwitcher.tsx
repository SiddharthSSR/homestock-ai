"use client";

type ActorOption = {
  userId: string;
  role: string;
  user: {
    name: string;
  };
};

// Demo-only switcher. NEXT_PUBLIC_DEMO_MODE is inlined at build, so the
// component is tree-shaken to nothing in non-demo bundles.
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function CurrentActorSwitcher({ members, currentActorId }: { members: ActorOption[]; currentActorId: string }) {
  if (!isDemoMode) return null;

  function onChange(value: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("actorId", value);
    window.location.href = url.toString();
  }

  const current = members.find((member) => member.userId === currentActorId);

  return (
    <label className="grid w-full gap-1 text-sm lg:w-auto">
      <span className="font-semibold text-bark">MVP actor</span>
      <select
        className="w-full rounded-xl border border-cocoa/15 bg-paper px-3 py-2 text-cocoa shadow-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-sage/30 lg:min-w-64"
        value={currentActorId}
        onChange={(event) => onChange(event.target.value)}
      >
        {members.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.user.name} · {member.role}
          </option>
        ))}
      </select>
      <span className="text-xs text-bark/75">Dev role switcher, not production auth{current ? ` · ${current.role}` : ""}</span>
    </label>
  );
}
