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

export async function resolveCurrentActorId(householdId: string, actorId?: string) {
  if (actorId) {
    const membership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId: actorId
        }
      }
    });
    if (membership) return actorId;
  }

  const admin = await prisma.householdMember.findFirst({
    where: { householdId, role: "ADMIN" },
    orderBy: { createdAt: "asc" }
  });
  if (admin) return admin.userId;

  const member = await prisma.householdMember.findFirst({
    where: { householdId },
    orderBy: { createdAt: "asc" }
  });
  if (member) return member.userId;

  return getDefaultActorId();
}
