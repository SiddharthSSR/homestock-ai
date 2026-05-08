import { PrismaClient, type Household, type HouseholdMember, type User } from "@prisma/client";
import { isDemoModeEnabled } from "../lib/household-selection";
import {
  USAGE,
  assertSafetyGuards,
  chooseHousehold,
  formatSafetyError,
  parseLinkUserArgs,
  type LinkUserArgs
} from "./lib/link-user-helpers";

async function main(rawArgv: string[]): Promise<number> {
  const parsed = parseLinkUserArgs(rawArgv);
  if (!parsed.ok) {
    console.error(`error: ${parsed.reason}\n\n${USAGE}`);
    return 1;
  }

  const args = parsed.args;
  if (args.help) {
    console.log(USAGE);
    return 0;
  }

  if (!process.env.DATABASE_URL) {
    console.error("error: DATABASE_URL is not set. Pass it inline; do not export it.\n\n" + USAGE);
    return 1;
  }

  const dbHost = describeDatabaseHost(process.env.DATABASE_URL);
  const nameFlagPresent = rawArgv.includes("--name");
  console.log(`db host: ${dbHost}${args.dryRun ? " (dry-run)" : ""}`);

  const prisma = new PrismaClient();
  try {
    return await execute(prisma, args, nameFlagPresent);
  } catch (error) {
    return reportPrismaFailure(error, dbHost);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

async function execute(prisma: PrismaClient, args: LinkUserArgs, nameFlagPresent: boolean): Promise<number> {
  const candidates = await prisma.household.findMany({
    where: args.householdId ? { id: args.householdId } : { name: args.householdName },
    select: { id: true, name: true }
  });

  const resolution = chooseHousehold(candidates, { id: args.householdId, name: args.householdName });
  if (!resolution.ok) {
    if (resolution.reason === "ambiguous") {
      const ids = resolution.matches.map((h) => h.id).join(", ");
      console.error(
        `error: multiple households named '${args.householdName}': ${ids}. Pass --householdId to disambiguate.`
      );
      return 1;
    }
    console.error(
      args.householdId
        ? `error: household with id '${args.householdId}' not found.`
        : `error: no household named '${args.householdName}'.`
    );
    return 1;
  }
  const household = resolution.household;

  const [existingUser, totalAdminCount] = await Promise.all([
    prisma.user.findUnique({ where: { email: args.email }, select: { id: true } }),
    prisma.householdMember.count({ where: { householdId: household.id, role: "ADMIN" } })
  ]);

  let priorMembership: Pick<HouseholdMember, "role"> | null = null;
  if (existingUser) {
    priorMembership = await prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId: household.id, userId: existingUser.id } },
      select: { role: true }
    });
  }

  const otherAdminCount =
    priorMembership?.role === "ADMIN" ? Math.max(totalAdminCount - 1, 0) : totalAdminCount;

  const guard = assertSafetyGuards({
    householdName: household.name,
    demoMode: isDemoModeEnabled(),
    allowDemo: args.allowDemo,
    allowFixture: args.allowFixture,
    allowLastAdminDemote: args.allowLastAdminDemote,
    existingRole: priorMembership?.role ?? null,
    targetRole: args.role,
    otherAdminCount
  });

  if (!guard.ok) {
    console.error(`error: ${formatSafetyError(guard.error)}`);
    return 1;
  }

  if (args.dryRun) {
    printSummary({
      household,
      userId: existingUser?.id ?? "(would be created)",
      userEmail: args.email,
      userName: args.name,
      isNewUser: !existingUser,
      isNewMembership: !priorMembership,
      role: args.role,
      dryRun: true
    });
    return 0;
  }

  const [user, membership] = await prisma.$transaction(async (tx) => {
    const upsertedUser: User = await tx.user.upsert({
      where: { email: args.email },
      update: nameFlagPresent ? { name: args.name } : {},
      create: { email: args.email, name: args.name }
    });

    const upsertedMembership: HouseholdMember = await tx.householdMember.upsert({
      where: { householdId_userId: { householdId: household.id, userId: upsertedUser.id } },
      update: { role: args.role },
      create: { householdId: household.id, userId: upsertedUser.id, role: args.role }
    });

    return [upsertedUser, upsertedMembership] as const;
  });

  printSummary({
    household,
    userId: user.id,
    userEmail: user.email ?? args.email,
    userName: user.name,
    isNewUser: !existingUser,
    isNewMembership: !priorMembership,
    role: membership.role,
    dryRun: false
  });

  return 0;
}

function describeDatabaseHost(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`;
  } catch {
    return "unknown";
  }
}

type SummaryInput = {
  household: Pick<Household, "id" | "name">;
  userId: string;
  userEmail: string;
  userName: string;
  isNewUser: boolean;
  isNewMembership: boolean;
  role: LinkUserArgs["role"];
  dryRun: boolean;
};

function printSummary(input: SummaryInput) {
  const verb = input.dryRun ? "would link" : "linked";
  const userVerb = input.isNewUser ? "create" : "update";
  const memberVerb = input.isNewMembership ? "new" : "existing";
  console.log("");
  console.log(`✓ ${verb} ${input.userName} <${input.userEmail}> to '${input.household.name}'`);
  console.log(`  user        id=${input.userId} (${userVerb})`);
  console.log(`  household   id=${input.household.id}`);
  console.log(`  membership  role=${input.role} (${memberVerb})`);
  if (input.dryRun) {
    console.log("");
    console.log("dry-run: no changes written.");
  } else {
    console.log("");
    console.log("Sign in via /sign-in once AUTH_SECRET, EMAIL_SERVER, and EMAIL_FROM are set on the deployment.");
  }
}

function reportPrismaFailure(error: unknown, dbHost: string): number {
  const code = extractPrismaCode(error);
  if (code === "P1001") {
    console.error(
      `error: P1001 Could not connect to ${dbHost}. If using Neon, the endpoint may be cold-starting; retry.`
    );
    return 2;
  }
  if (code) {
    console.error(`error: Prisma ${code}: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }
  if (error instanceof Error) {
    console.error(`error: ${error.message}`);
    return 2;
  }
  console.error("error: unknown failure");
  return 2;
}

function extractPrismaCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  const code = (error as { code: unknown }).code;
  return typeof code === "string" ? code : null;
}

main(process.argv.slice(2)).then((code) => {
  process.exit(code);
});
