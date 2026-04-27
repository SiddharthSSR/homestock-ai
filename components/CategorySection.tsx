export function CategorySection({
  title,
  count,
  children
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-3 border-b border-cocoa/10 pb-2">
        <h2 className="font-editorial text-3xl font-semibold leading-none text-forest">{title}</h2>
        {typeof count === "number" ? <p className="text-xs font-bold uppercase tracking-[0.22em] text-bark">{count} items</p> : null}
      </div>
      {children}
    </section>
  );
}
