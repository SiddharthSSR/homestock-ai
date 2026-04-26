import { prisma } from "@/lib/prisma";

export async function getDefaultActorId() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (user) return user.id;

  const created = await prisma.user.create({
    data: {
      name: "Local Admin",
      email: "local-admin@homestock.local"
    }
  });

  return created.id;
}

export async function getDefaultHouseholdId() {
  const household = await prisma.household.findFirst({ orderBy: { createdAt: "asc" } });
  if (household) return household.id;

  const actorId = await getDefaultActorId();
  const created = await prisma.household.create({
    data: {
      name: "My Household",
      location: "Local",
      createdBy: actorId,
      members: {
        create: {
          userId: actorId,
          role: "ADMIN"
        }
      }
    }
  });

  return created.id;
}
