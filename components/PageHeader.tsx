type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: string;
  children?: React.ReactNode;
};

export function PageHeader({ eyebrow = "Household", title, description, meta, children }: PageHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-cocoa/10 bg-paper shadow-editorial">
      <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-bark">{eyebrow}</p>
          <h1 className="font-editorial mt-3 max-w-3xl text-4xl font-semibold leading-[0.98] text-cocoa sm:text-5xl md:text-6xl">{title}</h1>
          {description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-bark sm:text-base">{description}</p> : null}
        </div>
        {meta ? <p className="text-right text-xs font-bold uppercase tracking-[0.28em] text-bark">{meta}</p> : null}
      </div>
      {children ? <div className="border-t border-cocoa/10">{children}</div> : null}
    </section>
  );
}
