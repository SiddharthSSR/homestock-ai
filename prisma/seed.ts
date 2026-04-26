import { PrismaClient } from "@prisma/client";
import { groceryCatalogSeeds, grocerySynonymSeeds } from "../lib/grocery/synonyms";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@homestock.local" },
    update: {},
    create: {
      name: "Household Admin",
      email: "admin@homestock.local",
      phone: "+910000000001"
    }
  });

  const cook = await prisma.user.upsert({
    where: { email: "cook@homestock.local" },
    update: {},
    create: {
      name: "Cook",
      email: "cook@homestock.local",
      phone: "+910000000002"
    }
  });

  const member = await prisma.user.upsert({
    where: { email: "member@homestock.local" },
    update: {},
    create: {
      name: "Household Member",
      email: "member@homestock.local",
      phone: "+910000000003"
    }
  });

  const household = await prisma.household.create({
    data: {
      name: "Demo Household",
      location: "Bengaluru",
      createdBy: admin.id,
      members: {
        create: [
          { userId: admin.id, role: "ADMIN" },
          { userId: cook.id, role: "COOK" },
          { userId: member.id, role: "MEMBER" }
        ]
      }
    }
  });

  for (const item of groceryCatalogSeeds) {
    await prisma.groceryItem.upsert({
      where: { canonicalName: item.canonicalName },
      update: {
        displayName: item.displayName,
        category: item.category,
        defaultUnit: item.defaultUnit,
        synonyms: item.synonyms
      },
      create: item
    });
  }

  for (const synonym of grocerySynonymSeeds) {
    await prisma.grocerySynonym.upsert({
      where: { synonym: synonym.synonym },
      update: {
        canonicalName: synonym.canonicalName,
        language: synonym.language
      },
      create: synonym
    });
  }

  const milk = await prisma.groceryItem.findUnique({ where: { canonicalName: "milk" } });
  const eggs = await prisma.groceryItem.findUnique({ where: { canonicalName: "eggs" } });

  if (milk) {
    await prisma.recurringPattern.upsert({
      where: { householdId_groceryItemId: { householdId: household.id, groceryItemId: milk.id } },
      update: {},
      create: {
        householdId: household.id,
        groceryItemId: milk.id,
        averageIntervalDays: 2,
        usualQuantity: 1,
        usualUnit: "litre",
        preferredBrand: "Akshayakalpa",
        lastOrderedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        confidenceScore: 0.74
      }
    });
  }

  if (eggs) {
    await prisma.recurringPattern.upsert({
      where: { householdId_groceryItemId: { householdId: household.id, groceryItemId: eggs.id } },
      update: {},
      create: {
        householdId: household.id,
        groceryItemId: eggs.id,
        averageIntervalDays: 7,
        usualQuantity: 30,
        usualUnit: "piece",
        preferredBrand: "Farm Eggs",
        lastOrderedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        confidenceScore: 0.66
      }
    });
  }

  console.log(`Seeded ${household.name} with users and grocery synonyms.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
