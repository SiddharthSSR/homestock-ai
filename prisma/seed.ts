import { AvailabilityStatus, CartDraftStatus, GroceryProvider, GroceryRequestStatus, GroceryUrgency, PrismaClient } from "@prisma/client";
import type { GroceryItem, Household, HouseholdRole, User } from "@prisma/client";
import { groceryCatalogSeeds, grocerySynonymSeeds } from "../lib/grocery/synonyms";

const prisma = new PrismaClient();

const fixtureHouseholdNames = [
  "QA Empty Household",
  "QA Starter Household",
  "QA Cart Household",
  "QA Memory Household",
  "Demo Household"
];

type FixtureUser = {
  key: string;
  name: string;
  email: string;
  phone: string;
};

type FixtureUserKey =
  | "emptyAdmin"
  | "starterAdmin"
  | "starterMember"
  | "starterCook"
  | "cartAdmin"
  | "cartMember"
  | "cartCook"
  | "memoryAdmin"
  | "memoryMember"
  | "memoryCook";

const fixtureUsers: FixtureUser[] = [
  { key: "emptyAdmin", name: "Empty Admin", email: "empty-admin@homestock.local", phone: "+910000000101" },
  { key: "starterAdmin", name: "Starter Admin", email: "starter-admin@homestock.local", phone: "+910000000201" },
  { key: "starterMember", name: "Starter Member", email: "starter-member@homestock.local", phone: "+910000000202" },
  { key: "starterCook", name: "Starter Cook", email: "starter-cook@homestock.local", phone: "+910000000203" },
  { key: "cartAdmin", name: "Cart Admin", email: "cart-admin@homestock.local", phone: "+910000000301" },
  { key: "cartMember", name: "Cart Member", email: "cart-member@homestock.local", phone: "+910000000302" },
  { key: "cartCook", name: "Cart Cook", email: "cart-cook@homestock.local", phone: "+910000000303" },
  { key: "memoryAdmin", name: "Memory Admin", email: "memory-admin@homestock.local", phone: "+910000000401" },
  { key: "memoryMember", name: "Memory Member", email: "memory-member@homestock.local", phone: "+910000000402" },
  { key: "memoryCook", name: "Memory Cook", email: "memory-cook@homestock.local", phone: "+910000000403" }
];

type SeedContext = {
  users: Record<FixtureUserKey, User>;
  items: Map<string, GroceryItem>;
};

async function main() {
  await seedCatalog();
  await resetFixtureHouseholds();

  const users = await seedUsers();
  const items = await loadCatalogItems();
  const context = { users, items };

  const empty = await seedEmptyHousehold(context);
  const starter = await seedStarterHousehold(context);
  const cart = await seedCartHousehold(context);
  const memory = await seedMemoryHousehold(context);

  console.log("Seeded HomeStock AI dev fixtures:");
  printHousehold(empty, users.emptyAdmin);
  printHousehold(starter, users.starterAdmin);
  printHousehold(cart, users.cartAdmin);
  printHousehold(memory, users.memoryAdmin);
  console.log("Use the household and actor switchers in the app, or add ?householdId=<id>&actorId=<id> to a route.");
}

async function seedUsers() {
  const entries = await Promise.all(
    fixtureUsers.map(async (fixture) => {
      const user = await prisma.user.upsert({
        where: { email: fixture.email },
        update: {
          name: fixture.name,
          phone: fixture.phone
        },
        create: {
          name: fixture.name,
          email: fixture.email,
          phone: fixture.phone
        }
      });

      return [fixture.key, user] as const;
    })
  );

  return Object.fromEntries(entries) as Record<FixtureUserKey, User>;
}

async function seedCatalog() {
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
}

async function loadCatalogItems() {
  const items = await prisma.groceryItem.findMany();
  return new Map(items.map((item) => [item.canonicalName, item]));
}

async function resetFixtureHouseholds() {
  const households = await prisma.household.findMany({
    where: { name: { in: fixtureHouseholdNames } },
    select: { id: true }
  });
  const householdIds = households.map((household) => household.id);

  if (!householdIds.length) return;

  await prisma.$transaction([
    prisma.orderItem.deleteMany({
      where: { order: { householdId: { in: householdIds } } }
    }),
    prisma.order.deleteMany({
      where: { householdId: { in: householdIds } }
    }),
    prisma.cartItem.deleteMany({
      where: {
        OR: [
          { cartDraft: { householdId: { in: householdIds } } },
          { groceryRequest: { householdId: { in: householdIds } } }
        ]
      }
    }),
    prisma.cartDraft.deleteMany({
      where: { householdId: { in: householdIds } }
    }),
    prisma.groceryRequest.deleteMany({
      where: { householdId: { in: householdIds } }
    }),
    prisma.groceryPreference.deleteMany({
      where: { householdId: { in: householdIds } }
    }),
    prisma.recurringPattern.deleteMany({
      where: { householdId: { in: householdIds } }
    }),
    prisma.memorySuggestionDismissal.deleteMany({
      where: { householdId: { in: householdIds } }
    }),
    prisma.auditLog.deleteMany({
      where: { householdId: { in: householdIds } }
    }),
    prisma.householdMember.deleteMany({
      where: { householdId: { in: householdIds } }
    }),
    prisma.household.deleteMany({
      where: { id: { in: householdIds } }
    })
  ]);
}

async function seedEmptyHousehold({ users }: SeedContext) {
  return createHousehold({
    name: "QA Empty Household",
    location: "Fixture: empty states",
    createdBy: users.emptyAdmin,
    members: [{ user: users.emptyAdmin, role: "ADMIN" }]
  });
}

async function seedStarterHousehold(context: SeedContext) {
  const household = await createHousehold({
    name: "QA Starter Household",
    location: "Fixture: add/list/approve",
    createdBy: context.users.starterAdmin,
    members: [
      { user: context.users.starterAdmin, role: "ADMIN" },
      { user: context.users.starterMember, role: "MEMBER" },
      { user: context.users.starterCook, role: "COOK" }
    ]
  });

  await createGroceryRequest(context, {
    household,
    canonicalName: "tomato",
    quantity: 1,
    unit: "kg",
    status: GroceryRequestStatus.PENDING,
    urgency: GroceryUrgency.MEDIUM,
    requestedBy: context.users.starterCook,
    rawText: "Tomato 1 kg",
    notes: "Dev fixture: pending cook request."
  });
  await createGroceryRequest(context, {
    household,
    canonicalName: "onion",
    quantity: 2,
    unit: "kg",
    status: GroceryRequestStatus.PENDING,
    urgency: GroceryUrgency.HIGH,
    requestedBy: context.users.starterCook,
    rawText: "Onion 2 kg",
    notes: "Dev fixture: urgent cook request."
  });
  await createGroceryRequest(context, {
    household,
    canonicalName: "curd",
    quantity: 500,
    unit: "g",
    status: GroceryRequestStatus.PENDING,
    urgency: GroceryUrgency.MEDIUM,
    requestedBy: context.users.starterMember,
    rawText: "Curd 500 g",
    notes: "Dev fixture: member request."
  });
  await createGroceryRequest(context, {
    household,
    canonicalName: "atta",
    quantity: 5,
    unit: "kg",
    status: GroceryRequestStatus.APPROVED,
    urgency: GroceryUrgency.LOW,
    requestedBy: context.users.starterCook,
    rawText: "Atta 5 kg",
    notes: "Dev fixture: already approved item for cart-readiness checks."
  });

  return household;
}

async function seedCartHousehold(context: SeedContext) {
  const household = await createHousehold({
    name: "QA Cart Household",
    location: "Fixture: mock cart flow",
    createdBy: context.users.cartAdmin,
    members: [
      { user: context.users.cartAdmin, role: "ADMIN" },
      { user: context.users.cartMember, role: "MEMBER" },
      { user: context.users.cartCook, role: "COOK" }
    ]
  });

  const cartRequests = await Promise.all([
    createGroceryRequest(context, {
      household,
      canonicalName: "atta",
      quantity: 1,
      unit: "kg",
      status: GroceryRequestStatus.ADDED_TO_CART,
      urgency: GroceryUrgency.MEDIUM,
      requestedBy: context.users.cartCook,
      rawText: "Atta 1 kg",
      notes: "Dev fixture: linked to existing mock cart."
    }),
    createGroceryRequest(context, {
      household,
      canonicalName: "oil",
      quantity: 1,
      unit: "litre",
      status: GroceryRequestStatus.ADDED_TO_CART,
      urgency: GroceryUrgency.MEDIUM,
      requestedBy: context.users.cartMember,
      rawText: "Oil 1 litre",
      notes: "Dev fixture: linked to existing mock cart."
    }),
    createGroceryRequest(context, {
      household,
      canonicalName: "coriander",
      quantity: null,
      unit: "bunch",
      status: GroceryRequestStatus.ADDED_TO_CART,
      urgency: GroceryUrgency.LOW,
      requestedBy: context.users.cartCook,
      rawText: "Coriander",
      notes: "Dev fixture: substitution example."
    })
  ]);

  await createCartDraft({
    household,
    createdBy: context.users.cartAdmin,
    status: CartDraftStatus.READY_FOR_APPROVAL,
    approvedBy: null,
    approvedAt: null,
    items: [
      {
        requestId: cartRequests[0].id,
        productId: "mock-atta-5kg",
        productName: "Whole Wheat Atta",
        brand: "Aashirvaad",
        quantity: 1,
        unit: "5 kg",
        price: 285,
        availabilityStatus: AvailabilityStatus.AVAILABLE
      },
      {
        requestId: cartRequests[1].id,
        productId: "mock-oil-1l",
        productName: "Sunflower Oil",
        brand: "Fortune",
        quantity: 1,
        unit: "1 litre",
        price: 165,
        availabilityStatus: AvailabilityStatus.LIMITED,
        substitutionReason: "Limited mock stock; review before approval."
      },
      {
        requestId: cartRequests[2].id,
        productId: "mock-coriander-sub",
        productName: "Coriander Leaves",
        brand: "Fresh Produce",
        quantity: null,
        unit: "1 bunch",
        price: 18,
        availabilityStatus: AvailabilityStatus.SUBSTITUTED,
        substitutionReason: "Exact bunch size unavailable in mock catalog."
      }
    ]
  });

  await createGroceryRequest(context, {
    household,
    canonicalName: "milk",
    quantity: 2,
    unit: "litre",
    status: GroceryRequestStatus.APPROVED,
    urgency: GroceryUrgency.MEDIUM,
    requestedBy: context.users.cartMember,
    rawText: "Milk 2 litre",
    notes: "Dev fixture: approved request ready for preparing another mock cart."
  });
  await createGroceryRequest(context, {
    household,
    canonicalName: "eggs",
    quantity: 12,
    unit: "piece",
    status: GroceryRequestStatus.APPROVED,
    urgency: GroceryUrgency.LOW,
    requestedBy: context.users.cartCook,
    rawText: "Eggs 12",
    notes: "Dev fixture: approved request ready for preparing another mock cart."
  });

  return household;
}

async function seedMemoryHousehold(context: SeedContext) {
  const household = await createHousehold({
    name: "QA Memory Household",
    location: "Fixture: recurring memory",
    createdBy: context.users.memoryAdmin,
    members: [
      { user: context.users.memoryAdmin, role: "ADMIN" },
      { user: context.users.memoryMember, role: "MEMBER" },
      { user: context.users.memoryCook, role: "COOK" }
    ]
  });

  const now = new Date();

  for (const daysAgo of [15, 12, 9, 6, 3]) {
    await createApprovedMemoryCart(context, {
      household,
      createdBy: context.users.memoryAdmin,
      requestedBy: context.users.memoryCook,
      approvedAt: daysBefore(now, daysAgo),
      items: [
        { canonicalName: "milk", quantity: 2, unit: "litre", productId: "mock-milk-1l", productName: "Toned Milk", brand: "Akshayakalpa", price: 76 },
        { canonicalName: "coriander", quantity: null, unit: "bunch", productId: "mock-coriander-bunch", productName: "Coriander Leaves", brand: "Fresh Produce", price: 18 },
        { canonicalName: "tomato", quantity: 1, unit: "kg", productId: "mock-tomato-1kg", productName: "Tomato", brand: "Fresh Produce", price: 42 }
      ]
    });
  }

  for (const daysAgo of [28, 21, 14, 7]) {
    await createApprovedMemoryCart(context, {
      household,
      createdBy: context.users.memoryAdmin,
      requestedBy: context.users.memoryMember,
      approvedAt: daysBefore(now, daysAgo),
      items: [{ canonicalName: "eggs", quantity: 12, unit: "piece", productId: "mock-eggs-30", productName: "Eggs", brand: "Farm Eggs", price: 245 }]
    });
  }

  for (const daysAgo of [62, 32]) {
    await createApprovedMemoryCart(context, {
      household,
      createdBy: context.users.memoryAdmin,
      requestedBy: context.users.memoryCook,
      approvedAt: daysBefore(now, daysAgo),
      items: [
        { canonicalName: "atta", quantity: 5, unit: "kg", productId: "mock-atta-5kg", productName: "Whole Wheat Atta", brand: "Aashirvaad", price: 285 },
        { canonicalName: "oil", quantity: 1, unit: "litre", productId: "mock-oil-1l", productName: "Sunflower Oil", brand: "Fortune", price: 165 }
      ]
    });
  }

  await seedMemoryPatternsAndPreferences(context, household, now);

  return household;
}

async function createHousehold({
  name,
  location,
  createdBy,
  members
}: {
  name: string;
  location: string;
  createdBy: User;
  members: { user: User; role: HouseholdRole }[];
}) {
  return prisma.household.create({
    data: {
      name,
      location,
      createdBy: createdBy.id,
      members: {
        create: members.map((member) => ({
          userId: member.user.id,
          role: member.role
        }))
      }
    }
  });
}

async function createGroceryRequest(
  context: SeedContext,
  {
    household,
    canonicalName,
    quantity,
    unit,
    status,
    urgency,
    requestedBy,
    rawText,
    notes,
    createdAt
  }: {
    household: Household;
    canonicalName: string;
    quantity: number | null;
    unit: string | null;
    status: GroceryRequestStatus;
    urgency: GroceryUrgency;
    requestedBy: User;
    rawText: string;
    notes: string;
    createdAt?: Date;
  }
) {
  const item = requireItem(context, canonicalName);
  return prisma.groceryRequest.create({
    data: {
      householdId: household.id,
      groceryItemId: item.id,
      rawText,
      canonicalName: item.canonicalName,
      displayName: item.displayName,
      quantity,
      unit,
      category: item.category,
      urgency,
      status,
      requestedBy: requestedBy.id,
      notes,
      createdAt
    }
  });
}

async function createCartDraft({
  household,
  createdBy,
  status,
  approvedBy,
  approvedAt,
  items
}: {
  household: Household;
  createdBy: User;
  status: CartDraftStatus;
  approvedBy: User | null;
  approvedAt: Date | null;
  items: {
    requestId: string;
    productId: string;
    productName: string;
    brand: string;
    quantity: number | null;
    unit: string | null;
    price: number;
    availabilityStatus: AvailabilityStatus;
    substitutionReason?: string;
  }[];
}) {
  const estimatedTotal = items.reduce((total, item) => total + item.price * (item.quantity && item.quantity > 0 ? item.quantity : 1), 0);

  return prisma.cartDraft.create({
    data: {
      householdId: household.id,
      status,
      estimatedTotal,
      provider: GroceryProvider.MOCK,
      createdBy: createdBy.id,
      approvedBy: approvedBy?.id,
      approvedAt,
      createdAt: approvedAt ?? undefined,
      items: {
        create: items.map((item) => ({
          groceryRequestId: item.requestId,
          productId: item.productId,
          productName: item.productName,
          brand: item.brand,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          availabilityStatus: item.availabilityStatus,
          substitutionReason: item.substitutionReason
        }))
      }
    }
  });
}

async function createApprovedMemoryCart(
  context: SeedContext,
  {
    household,
    createdBy,
    requestedBy,
    approvedAt,
    items
  }: {
    household: Household;
    createdBy: User;
    requestedBy: User;
    approvedAt: Date;
    items: {
      canonicalName: string;
      quantity: number | null;
      unit: string | null;
      productId: string;
      productName: string;
      brand: string;
      price: number;
    }[];
  }
) {
  const requests = await Promise.all(
    items.map((item) =>
      createGroceryRequest(context, {
        household,
        canonicalName: item.canonicalName,
        quantity: item.quantity,
        unit: item.unit,
        status: GroceryRequestStatus.ADDED_TO_CART,
        urgency: GroceryUrgency.MEDIUM,
        requestedBy,
        rawText: formatRawText(item.quantity, item.unit, requireItem(context, item.canonicalName).displayName),
        notes: "Dev fixture: historical household memory activity.",
        createdAt: approvedAt
      })
    )
  );

  await createCartDraft({
    household,
    createdBy,
    status: CartDraftStatus.APPROVED,
    approvedBy: createdBy,
    approvedAt,
    items: items.map((item, index) => ({
      requestId: requests[index].id,
      productId: item.productId,
      productName: item.productName,
      brand: item.brand,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      availabilityStatus: AvailabilityStatus.AVAILABLE
    }))
  });
}

async function seedMemoryPatternsAndPreferences(context: SeedContext, household: Household, now: Date) {
  const patterns = [
    { canonicalName: "milk", averageIntervalDays: 3, usualQuantity: 2, usualUnit: "litre", preferredBrand: "Akshayakalpa", lastOrderedAt: daysBefore(now, 3), confidenceScore: 0.78 },
    { canonicalName: "eggs", averageIntervalDays: 7, usualQuantity: 12, usualUnit: "piece", preferredBrand: "Farm Eggs", lastOrderedAt: daysBefore(now, 7), confidenceScore: 0.72 },
    { canonicalName: "atta", averageIntervalDays: 30, usualQuantity: 5, usualUnit: "kg", preferredBrand: "Aashirvaad", lastOrderedAt: daysBefore(now, 32), confidenceScore: 0.69 },
    { canonicalName: "oil", averageIntervalDays: 30, usualQuantity: 1, usualUnit: "litre", preferredBrand: "Fortune", lastOrderedAt: daysBefore(now, 32), confidenceScore: 0.67 },
    { canonicalName: "coriander", averageIntervalDays: 3, usualQuantity: null, usualUnit: "bunch", preferredBrand: "Fresh Produce", lastOrderedAt: daysBefore(now, 3), confidenceScore: 0.61 }
  ];

  for (const pattern of patterns) {
    const item = requireItem(context, pattern.canonicalName);
    await prisma.recurringPattern.create({
      data: {
        householdId: household.id,
        groceryItemId: item.id,
        averageIntervalDays: pattern.averageIntervalDays,
        usualQuantity: pattern.usualQuantity,
        usualUnit: pattern.usualUnit,
        preferredBrand: pattern.preferredBrand,
        lastOrderedAt: pattern.lastOrderedAt,
        confidenceScore: pattern.confidenceScore
      }
    });

    await prisma.groceryPreference.create({
      data: {
        householdId: household.id,
        groceryItemId: item.id,
        preferredBrand: pattern.preferredBrand,
        preferredQuantity: pattern.usualQuantity,
        preferredUnit: pattern.usualUnit,
        notes: "Dev fixture: household memory preference."
      }
    });
  }
}

function requireItem(context: SeedContext, canonicalName: string) {
  const item = context.items.get(canonicalName);
  if (!item) throw new Error(`Missing grocery catalog item: ${canonicalName}`);
  return item;
}

function daysBefore(now: Date, days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function formatRawText(quantity: number | null, unit: string | null, displayName: string) {
  if (!quantity) return displayName;
  return [quantity, unit, displayName].filter(Boolean).join(" ");
}

function printHousehold(household: Household, admin: User) {
  console.log(`- ${household.name}: householdId=${household.id}, adminActorId=${admin.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
