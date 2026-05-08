import { z } from "zod";

export const FIXTURE_HOUSEHOLD_NAMES = [
  "QA Empty Household",
  "QA Starter Household",
  "QA Cart Household",
  "QA Memory Household",
  "Demo Household"
] as const;

export type LinkUserRole = "ADMIN" | "MEMBER" | "COOK";

export type LinkUserArgs = {
  email: string;
  name: string;
  role: LinkUserRole;
  householdId?: string;
  householdName?: string;
  dryRun: boolean;
  allowDemo: boolean;
  allowFixture: boolean;
  allowLastAdminDemote: boolean;
  help: boolean;
};

export type ParseResult =
  | { ok: true; args: LinkUserArgs }
  | { ok: false; reason: string };

const RoleEnum = z.enum(["ADMIN", "MEMBER", "COOK"]);
const EmailSchema = z
  .string({ required_error: "--email is required" })
  .min(1, "--email is required")
  .email("--email must be a valid email");

const ArgSchema = z
  .object({
    email: EmailSchema,
    name: z.string().min(1).optional(),
    role: RoleEnum,
    householdId: z.string().min(1).optional(),
    householdName: z.string().min(1).optional(),
    dryRun: z.boolean(),
    allowDemo: z.boolean(),
    allowFixture: z.boolean(),
    allowLastAdminDemote: z.boolean(),
    help: z.boolean()
  })
  .refine((v) => v.help || Boolean(v.householdId) !== Boolean(v.householdName), {
    message: "exactly one of --householdId or --householdName is required"
  });

type RawArgs = {
  email?: string;
  name?: string;
  role?: string;
  householdId?: string;
  householdName?: string;
  dryRun: boolean;
  allowDemo: boolean;
  allowFixture: boolean;
  allowLastAdminDemote: boolean;
  help: boolean;
};

const FLAG_KEYS = new Set([
  "--email",
  "--name",
  "--role",
  "--householdId",
  "--householdName"
]);
const BOOLEAN_KEYS = new Set([
  "--dry-run",
  "--allow-demo",
  "--allow-fixture",
  "--allow-last-admin-demote",
  "--help",
  "-h"
]);

function readArgv(argv: string[]): { raw: RawArgs; error?: string } {
  const raw: RawArgs = {
    dryRun: false,
    allowDemo: false,
    allowFixture: false,
    allowLastAdminDemote: false,
    help: false
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (BOOLEAN_KEYS.has(token)) {
      if (token === "--dry-run") raw.dryRun = true;
      else if (token === "--allow-demo") raw.allowDemo = true;
      else if (token === "--allow-fixture") raw.allowFixture = true;
      else if (token === "--allow-last-admin-demote") raw.allowLastAdminDemote = true;
      else if (token === "--help" || token === "-h") raw.help = true;
      continue;
    }

    if (FLAG_KEYS.has(token)) {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--") || value === "-h") {
        return { raw, error: `${token} requires a value` };
      }
      i += 1;
      if (token === "--email") raw.email = value;
      else if (token === "--name") raw.name = value;
      else if (token === "--role") raw.role = value;
      else if (token === "--householdId") raw.householdId = value;
      else if (token === "--householdName") raw.householdName = value;
      continue;
    }

    return { raw, error: `unknown argument: ${token}` };
  }

  return { raw };
}

export function parseLinkUserArgs(argv: string[]): ParseResult {
  const { raw, error } = readArgv(argv);
  if (error) return { ok: false, reason: error };

  if (raw.help) {
    // Help mode short-circuits validation; entry point prints usage and exits 0.
    return {
      ok: true,
      args: {
        email: raw.email ?? "",
        name: raw.name ?? "",
        role: (raw.role as LinkUserRole) ?? "ADMIN",
        householdId: raw.householdId,
        householdName: raw.householdName,
        dryRun: raw.dryRun,
        allowDemo: raw.allowDemo,
        allowFixture: raw.allowFixture,
        allowLastAdminDemote: raw.allowLastAdminDemote,
        help: true
      }
    };
  }

  const parsed = ArgSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const path = first.path.length ? first.path.join(".") + ": " : "";
    return { ok: false, reason: path + first.message };
  }

  const v = parsed.data;
  const email = v.email.trim().toLowerCase();
  const fallbackName = email.split("@")[0] || email;

  return {
    ok: true,
    args: {
      email,
      name: v.name ?? fallbackName,
      role: v.role,
      householdId: v.householdId,
      householdName: v.householdName,
      dryRun: v.dryRun,
      allowDemo: v.allowDemo,
      allowFixture: v.allowFixture,
      allowLastAdminDemote: v.allowLastAdminDemote,
      help: false
    }
  };
}

export type HouseholdLike = { id: string; name: string };

export type HouseholdResolution<T extends HouseholdLike> =
  | { ok: true; household: T }
  | { ok: false; reason: "not-found" }
  | { ok: false; reason: "ambiguous"; matches: T[] };

export function chooseHousehold<T extends HouseholdLike>(
  found: T[],
  by: { id?: string; name?: string }
): HouseholdResolution<T> {
  if (by.id) {
    const match = found.find((h) => h.id === by.id);
    return match ? { ok: true, household: match } : { ok: false, reason: "not-found" };
  }
  if (by.name) {
    const matches = found.filter((h) => h.name === by.name);
    if (matches.length === 0) return { ok: false, reason: "not-found" };
    if (matches.length > 1) return { ok: false, reason: "ambiguous", matches };
    return { ok: true, household: matches[0] };
  }
  return { ok: false, reason: "not-found" };
}

export type SafetyGuardInput = {
  householdName: string;
  demoMode: boolean;
  allowDemo: boolean;
  allowFixture: boolean;
  allowLastAdminDemote: boolean;
  existingRole: LinkUserRole | null;
  targetRole: LinkUserRole;
  otherAdminCount: number;
};

export type SafetyError =
  | { kind: "demo-mode" }
  | { kind: "fixture-household"; householdName: string }
  | { kind: "last-admin-demote"; householdName: string };

export type SafetyResult = { ok: true } | { ok: false; error: SafetyError };

export function isFixtureHousehold(name: string): boolean {
  return (FIXTURE_HOUSEHOLD_NAMES as readonly string[]).includes(name);
}

export function assertSafetyGuards(input: SafetyGuardInput): SafetyResult {
  if (input.demoMode && !input.allowDemo) {
    return { ok: false, error: { kind: "demo-mode" } };
  }

  if (isFixtureHousehold(input.householdName) && !input.allowFixture) {
    return { ok: false, error: { kind: "fixture-household", householdName: input.householdName } };
  }

  // Last-admin demotion: only triggers when the current membership is ADMIN,
  // the new role is not ADMIN, and there is no other ADMIN to take over.
  const isDemoting = input.existingRole === "ADMIN" && input.targetRole !== "ADMIN";
  if (isDemoting && input.otherAdminCount === 0 && !input.allowLastAdminDemote) {
    return { ok: false, error: { kind: "last-admin-demote", householdName: input.householdName } };
  }

  return { ok: true };
}

export function formatSafetyError(error: SafetyError): string {
  if (error.kind === "demo-mode") {
    return "Refusing to run against a demo-mode database. Pass --allow-demo to override.";
  }
  if (error.kind === "fixture-household") {
    return `Refusing to write into fixture household '${error.householdName}'. Pass --allow-fixture to override (note: prisma db seed will reset it).`;
  }
  return `Refusing to demote the last ADMIN of '${error.householdName}'. Pass --allow-last-admin-demote to override.`;
}

export const USAGE = `Usage: tsx scripts/link-user.ts --email <email> --role ADMIN|MEMBER|COOK \\
       (--householdId <id> | --householdName "<name>") \\
       [--name "<name>"] [--dry-run] \\
       [--allow-demo] [--allow-fixture] [--allow-last-admin-demote]

Required:
  --email             Login email. Lowercased before upsert.
  --role              ADMIN | MEMBER | COOK.
  --householdId       Target household by id (mutually exclusive with --householdName).
  --householdName     Target household by exact name (mutually exclusive with --householdId).

Optional:
  --name              Display name. Defaults to email local-part for new users.
  --dry-run           Plan only; no writes.
  --allow-demo        Required when DEMO_MODE/NEXT_PUBLIC_DEMO_MODE is true.
  --allow-fixture     Required when targeting a seeded QA/Demo household.
  --allow-last-admin-demote  Required to drop the only remaining household ADMIN.

Examples:
  tsx scripts/link-user.ts --email me@example.com --role ADMIN --householdName "Family"
  tsx scripts/link-user.ts --email me@example.com --role MEMBER --householdId hh_123 --dry-run`;
