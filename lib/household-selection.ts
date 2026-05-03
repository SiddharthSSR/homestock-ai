export function resolveSelectedHousehold<T extends { id: string }>(households: T[], householdId?: string | null) {
  return households.find((household) => household.id === householdId) ?? households[0] ?? null;
}

const demoPreferredHouseholdNames = [
  "QA Memory Household",
  "QA Starter Household",
  "QA Cart Household"
];

export function pickDemoDefaultHousehold<T extends { name: string }>(households: T[]): T | null {
  for (const name of demoPreferredHouseholdNames) {
    const match = households.find((household) => household.name === name);
    if (match) return match;
  }
  return households[0] ?? null;
}

type DemoEnvLike = Record<string, string | undefined>;

export function isDemoModeEnabled(env: DemoEnvLike = process.env) {
  return env.NEXT_PUBLIC_DEMO_MODE === "true" || env.DEMO_MODE === "true";
}
