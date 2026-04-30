export type DuplicateHintRequest = {
  canonicalName: string;
  displayName: string;
  status: string;
};

export type DuplicateHint = {
  canonicalName: string;
  names: string[];
};

const activeStatuses = new Set(["PENDING", "APPROVED", "ADDED_TO_CART"]);

export function findDuplicateHints(requests: DuplicateHintRequest[]) {
  const grouped = new Map<string, Set<string>>();

  for (const request of requests) {
    if (!activeStatuses.has(request.status)) continue;

    const canonicalName = request.canonicalName.trim().toLowerCase();
    const displayName = request.displayName.trim();
    if (!canonicalName || !displayName) continue;

    if (!grouped.has(canonicalName)) {
      grouped.set(canonicalName, new Set());
    }
    grouped.get(canonicalName)?.add(displayName);
  }

  return Array.from(grouped.entries())
    .map(([canonicalName, names]) => ({ canonicalName, names: Array.from(names) }))
    .filter((hint) => hint.names.length > 1);
}
