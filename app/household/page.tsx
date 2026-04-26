import { prisma } from "@/lib/prisma";
import { getDefaultActorId } from "@/lib/services/household-service";

export const dynamic = "force-dynamic";

export default async function HouseholdPage() {
  const actorId = await getDefaultActorId();
  const households = await prisma.household.findMany({
    include: {
      members: {
        include: { user: true },
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: { createdAt: "asc" }
  });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <h1 className="text-2xl font-semibold text-ink">Household setup</h1>
        <p className="mt-2 text-sm text-slate-600">Create households and add members with roles. Phase 1 uses local demo users.</p>
        <form action="/api/households" method="post" className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input name="name" className="rounded-md border border-slate-300 px-3 py-2" placeholder="Household name" required />
          <input name="location" className="rounded-md border border-slate-300 px-3 py-2" placeholder="Location" />
          <input type="hidden" name="createdBy" value={actorId} />
          <button className="rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">Create</button>
        </form>
      </section>

      <section className="grid gap-4">
        {households.map((household) => (
          <article key={household.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">{household.name}</h2>
                <p className="text-sm text-slate-600">{household.location ?? "No location set"}</p>
              </div>
              <form action={`/api/households/${household.id}/members`} method="post" className="flex flex-wrap gap-2">
                <select name="userId" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <select name="role" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                  <option value="COOK">Cook</option>
                </select>
                <button className="rounded-md border border-slate-300 px-3 py-2 text-sm">Add member</button>
              </form>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {household.members.map((member) => (
                <div key={member.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-medium text-ink">{member.user.name}</p>
                  <p className="text-slate-600">{member.role}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
