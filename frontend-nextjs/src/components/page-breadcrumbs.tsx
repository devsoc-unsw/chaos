"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BreadcrumbSegment,
  EntityResolver,
  SEGMENT_LABELS,
  humanizeSegment,
  parseBreadcrumbPath,
} from "@/lib/breadcrumbs"

interface PageBreadcrumbsProps {
  dict: any;
}

/**
 * Breadcrumb trail for the current dashboard page, derived from the URL.
 * Mounted once in the org layout, so pages don't need to render it.
 * Route labels and ID lookups are configured in src/lib/breadcrumbs.ts.
 */
export function PageBreadcrumbs({ dict }: PageBreadcrumbsProps) {
  const pathname = usePathname();
  const parsed = parseBreadcrumbPath(pathname);

  // Not inside an organisation, so there's nothing to show
  if (!parsed) return null;

  const { rootHref, segments } = parsed;
  const lastIndex = segments.length - 1;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Crumb href={rootHref} isCurrent={segments.length === 0}>
            {dict.common.dashboard}
          </Crumb>
        </BreadcrumbItem>

        {segments.map((segment, i) => (
          // Not keyed by href alone: a template crumb and its "Edit" crumb share one
          <Fragment key={`${i}-${segment.segment}`}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Crumb href={segment.href} isCurrent={i === lastIndex}>
                <SegmentLabel segment={segment} dict={dict} />
              </Crumb>
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** A link to `href`, or plain text if it's the page we're already on. */
function Crumb({ href, isCurrent, children }: { href: string; isCurrent: boolean; children: React.ReactNode }) {
  if (isCurrent) {
    return <BreadcrumbPage>{children}</BreadcrumbPage>;
  }

  return (
    <BreadcrumbLink asChild>
      <Link href={href}>{children}</Link>
    </BreadcrumbLink>
  );
}

/** The text shown for one crumb, depending on what kind of segment it is. */
function SegmentLabel({ segment, dict }: { segment: BreadcrumbSegment; dict: any }) {
  switch (segment.kind) {
    case "static":
      return SEGMENT_LABELS[segment.segment](dict);
    case "entity":
      return <EntityName id={segment.segment} resolver={segment.resolver} />;
    case "unknown":
      return humanizeSegment(segment.segment);
  }
}

/**
 * Looks up the display name for an ID segment.
 * This is its own component so each crumb can call useQuery; calling hooks in a loop isn't allowed.
 */
function EntityName({ id, resolver }: { id: string; resolver: EntityResolver }) {
  const { data: name, isPending, isError } = useQuery({
    queryKey: resolver.queryKey(id),
    queryFn: () => resolver.queryFn(id),
    select: resolver.getName,
  });

  if (isPending) {
    return <Skeleton className="h-4 w-24" />;
  }

  // If the lookup fails, show the end of the ID so the crumb is still recognisable
  const label = isError || !name ? `#${id.slice(-6)}` : name;

  return (
    <span className="block max-w-[200px] truncate" title={label}>
      {label}
    </span>
  );
}
