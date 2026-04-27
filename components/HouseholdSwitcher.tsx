"use client";

type Household = {
  id: string;
  name: string;
};

export function HouseholdSwitcher({ households, currentHouseholdId }: { households: Household[]; currentHouseholdId?: string }) {
  function onChange(value: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("householdId", value);
    window.location.href = url.toString();
  }

  return (
    <label className="grid w-full gap-1 text-sm lg:w-auto">
      <span className="font-semibold text-bark">Household</span>
      <select
        className="w-full rounded-xl border border-cocoa/15 bg-paper px-3 py-2 text-cocoa shadow-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-sage/30 lg:min-w-64"
        value={currentHouseholdId}
        onChange={(event) => onChange(event.target.value)}
      >
        {households.map((household) => (
          <option key={household.id} value={household.id}>
            {household.name}
          </option>
        ))}
      </select>
    </label>
  );
}
