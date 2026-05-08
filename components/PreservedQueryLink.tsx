"use client";

import Link, { type LinkProps } from "next/link";
import { Suspense, type AnchorHTMLAttributes } from "react";
import { useSearchParams } from "next/navigation";
import { hrefWithPreservedParams, selectPreservedParams } from "@/lib/navigation";

type PreservedQueryLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> &
  Omit<LinkProps, "href"> & {
    href: string;
  };

export function PreservedQueryLink(props: PreservedQueryLinkProps) {
  return (
    <Suspense fallback={<Link {...props} />}>
      <PreservedQueryLinkInner {...props} />
    </Suspense>
  );
}

// NEXT_PUBLIC_ env vars are inlined at build time in client components, so
// there is no hydration mismatch between server-rendered and client-rendered
// link hrefs.
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function PreservedQueryLinkInner({ href, ...props }: PreservedQueryLinkProps) {
  const searchParams = useSearchParams();
  const preserved = selectPreservedParams({
    actorId: searchParams.get("actorId"),
    householdId: searchParams.get("householdId"),
    demoMode: isDemoMode
  });
  const resolvedHref = hrefWithPreservedParams(href, preserved);

  return <Link href={resolvedHref} {...props} />;
}
