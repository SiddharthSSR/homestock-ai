export type PreservedNavigationParams = {
  actorId?: string | null;
  householdId?: string | null;
};

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
