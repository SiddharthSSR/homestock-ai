"use client";

import Link, { type LinkProps } from "next/link";
import { Suspense, type AnchorHTMLAttributes } from "react";
import { useSearchParams } from "next/navigation";
import { hrefWithPreservedParams } from "@/lib/navigation";

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

function PreservedQueryLinkInner({ href, ...props }: PreservedQueryLinkProps) {
  const searchParams = useSearchParams();
  const resolvedHref = hrefWithPreservedParams(href, {
    actorId: searchParams.get("actorId"),
    householdId: searchParams.get("householdId")
  });

  return <Link href={resolvedHref} {...props} />;
}
