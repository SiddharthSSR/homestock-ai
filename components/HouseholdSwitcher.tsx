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
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">Household</span>
      <select
        className="min-w-64 rounded-md border border-slate-300 bg-white px-3 py-2"
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
