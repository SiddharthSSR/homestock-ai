export type PreservedNavigationParams = {
  actorId?: string | null;
  householdId?: string | null;
};

// In demo mode the URL-based actorId is the demo identity, so it must
// propagate through navigation. In non-demo mode actorId is untrusted input
// and must be dropped from links so it never reaches the server again.
export function selectPreservedParams(input: { actorId?: string | null; householdId?: string | null; demoMode: boolean }): PreservedNavigationParams {
  return {
    actorId: input.demoMode ? input.actorId ?? null : null,
    householdId: input.householdId ?? null
  };
}

export function hrefWithPreservedParams(href: string, params: PreservedNavigationParams) {
  if (!href.startsWith("/")) return href;

  const [pathname, query = ""] = href.split("?");
  const searchParams = new URLSearchParams(query);

  if (params.householdId && !searchParams.has("householdId")) {
    searchParams.set("householdId", params.householdId);
  }

  if (params.actorId && !searchParams.has("actorId")) {
    searchParams.set("actorId", params.actorId);
  }

  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
