export function resolveSelectedHousehold<T extends { id: string }>(households: T[], householdId?: string | null) {
  return households.find((household) => household.id === householdId) ?? households[0] ?? null;
}
