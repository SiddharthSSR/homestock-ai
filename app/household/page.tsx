import { CurrentActorSwitcher } from "@/components/CurrentActorSwitcher";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { SummaryCard } from "@/components/SummaryCard";
import { resolveSelectedHousehold } from "@/lib/household-selection";
import { prisma } from "@/lib/prisma";
import { getDefaultHouseholdId, resolveCurrentActorId } from "@/lib/services/household-service";
import { getHouseholdRole, roleCapabilities } from "@/lib/services/permissions-service";

export const dynamic = "force-dynamic";

export default async function HouseholdPage({ searchParams }: { searchParams: Promise<{ householdId?: string; actorId?: string }> }) {
  const params = await searchParams;
  const households = await prisma.household.findMany({
    include: {
      members: {
        include: { user: true },
        orderBy: { createdAt: "asc" }
      },
      preferences: {
        include: { groceryItem: true },
        orderBy: { updatedAt: "desc" }
      }
    },
    orderBy: { createdAt: "asc" }
  });
  const selectedHousehold = resolveSelectedHousehold(households, params.householdId);
  const householdId = selectedHousehold?.id ?? (await getDefaultHouseholdId());
  const actorId = await resolveCurrentActorId(householdId, params.actorId);
  const [members, role] = await Promise.all([
    prisma.householdMember.findMany({
      where: { householdId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" }
    }),
    getHouseholdRole(householdId, actorId)
  ]);
  const permissions = roleCapabilities(role);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const activeHousehold = selectedHousehold ?? households.find((household) => household.id === householdId) ?? households[0];
  const adminCount = activeHousehold?.members.filter((member) => member.role === "ADMIN").length ?? 0;
  const cookCount = activeHousehold?.members.filter((member) => member.role === "COOK").length ?? 0;

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          eyebrow="Household"
          title="Family Controls"
          meta={`${households.length} household${households.length === 1 ? "" : "s"}`}
          description="Manage members, roles, approval rules, grocery preferences, and how household memory is used."
        />
        <div className="grid gap-3">
          <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
          <CurrentActorSwitcher members={members} currentActorId={actorId} />
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Members" value={activeHousehold?.members.length ?? 0} detail="Across roles" tone="lavender" />
        <SummaryCard label="Admins" value={adminCount} detail="Can approve carts" tone="peach" />
        <SummaryCard label="Cook helpers" value={cookCount} detail="Simple request mode" tone="sage" />
      </section>

      {permissions.canManageHousehold ? (
        <section className="rounded-[1.5rem] border border-cocoa/10 bg-paper p-5 shadow-editorial">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-bark">Create household</p>
          <form action="/api/households" method="post" className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input name="name" aria-label="Household name" className="rounded-md border border-cocoa/15 bg-cream px-3 py-2 text-cocoa" placeholder="Household name" required />
            <input name="location" aria-label="Household location" className="rounded-md border border-cocoa/15 bg-cream px-3 py-2 text-cocoa" placeholder="Location" />
            <input type="hidden" name="createdBy" value={actorId} />
            <button className="rounded-md bg-forest px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-paper hover:bg-cocoa">Create</button>
          </form>
        </section>
      ) : (
        <section className="rounded-lg border border-cocoa/10 bg-paper p-5 text-sm font-semibold text-bark shadow-panel">Only household admins can manage household settings.</section>
      )}

      <section className="grid gap-4">
        {households.map((household) => (
          <article key={household.id} className="rounded-[1.5rem] border border-cocoa/10 bg-paper p-5 shadow-editorial">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-bark">Members and roles</p>
                <h2 className="font-editorial mt-2 text-4xl font-semibold text-cocoa">{household.name}</h2>
                <p className="mt-1 text-sm text-bark">{household.location ?? "No location set"}</p>
              </div>
              {permissions.canManageHousehold && household.id === householdId ? (
                <form action={`/api/households/${household.id}/members`} method="post" className="flex flex-wrap gap-2">
                  <input type="hidden" name="actorId" value={actorId} />
                  <select name="userId" aria-label="Household member" className="rounded-md border border-cocoa/15 bg-cream px-3 py-2 text-sm text-cocoa">
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <select name="role" aria-label="Household role" className="rounded-md border border-cocoa/15 bg-cream px-3 py-2 text-sm text-cocoa">
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                    <option value="COOK">Cook</option>
                  </select>
                  <button className="rounded-md border border-cocoa/20 bg-cream px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cocoa">Add member</button>
                </form>
              ) : household.id === householdId ? (
                <p className="max-w-sm text-sm font-semibold text-bark">Only household admins can manage members for this household.</p>
              ) : (
                <p className="max-w-sm text-sm text-bark">Select this household to manage its members.</p>
              )}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {household.members.map((member) => (
                <div key={member.id} className="rounded-lg border border-cocoa/10 bg-cream p-4">
                  <p className="font-semibold text-cocoa">{member.user.name}</p>
                  <p className="mt-1 text-sm text-bark">{member.user.email ?? member.user.phone ?? "Local user"}</p>
                  <div className="mt-3">
                    <StatusPill tone={member.role === "ADMIN" ? "approved" : member.role === "COOK" ? "cart" : "neutral"}>{member.role}</StatusPill>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <ControlCard title="Approval rules" detail="Admin approval is required before cart approval or any future checkout." />
              <ControlCard title="Grocery preferences" detail={household.preferences.length ? `${household.preferences.length} saved preferences` : "Preferred brands and quantities will appear here as memory grows."} />
              <ControlCard title="Privacy and memory" detail="Household memory is local to this app setup. External ordering stays disabled until configured." />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ControlCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-cocoa/10 bg-sage/70 p-4 text-forest">
      <p className="font-editorial text-2xl font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-forest/80">{detail}</p>
    </div>
  );
}
