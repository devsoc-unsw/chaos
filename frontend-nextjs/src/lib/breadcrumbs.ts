/**
 * Breadcrumbs for the organisation dashboard, built from the URL.
 *
 * Everything up to the org ID becomes the root "Dashboard" crumb, and each
 * segment after it becomes a crumb of its own:
 *
 *   /dashboard/organisation/{orgId}/campaigns/{campaignId}/edit
 *   Dashboard › Campaigns › Subcommittee Recruitment 2025 › Edit
 *
 * Adding a new route:
 * - Fixed segments (e.g. `offers`) go in SEGMENT_LABELS.
 * - ID segments (e.g. `campaigns/{id}`) need a resolver in ENTITY_RESOLVERS.
 * Anything not listed still renders, with the raw segment tidied up.
 */

import { getCampaign } from "@/models/campaign";
import { getEmailTemplate } from "@/models/email";
import { getApplication } from "@/models/application";

// Locale prefixes that may appear at the start of the URL (see src/proxy.ts)
export const LOCALES = ["en", "zh-CN"];

/**
 * Labels for fixed path segments, keyed by the segment as it appears in the URL.
 * Labels are read from the i18n dictionary so they follow the current language.
 */
export const SEGMENT_LABELS: Record<string, (dict: any) => string> = {
  campaigns: (dict) => dict.common.campaigns,
  templates: (dict) => dict.dashboard.email_templates,
  members: (dict) => dict.dashboard.members.members,
  settings: (dict) => dict.common.settings,
  questions: (dict) => dict.common.questions,
  applications: (dict) => dict.dashboard.breadcrumbs.applications,
  offers: (dict) => dict.dashboard.breadcrumbs.offers,
  review: (dict) => dict.dashboard.breadcrumbs.review,
  edit: (dict) => dict.dashboard.breadcrumbs.edit,
  new: (dict) => dict.dashboard.breadcrumbs.new,
};

/** Describes how to turn an ID segment into a display name. */
export interface EntityResolver {
  // React Query key. Use the key the page already prefetches so the name comes from cache. 
  queryKey: (id: string) => unknown[];
  // Fetches the entity when it isn't cached yet. 
  queryFn: (id: string) => Promise<any>;
  // Picks the display name out of the fetched entity. 
  getName: (entity: any) => string;
  // Overrides the crumb's link, for entities with no page at their own path. 
  href?: (path: string) => string;
}

/**
 * Resolvers for ID segments, keyed by the segment that comes before the ID.
 */
export const ENTITY_RESOLVERS: Record<string, EntityResolver> = {
  campaigns: {
    queryKey: (id) => [`${id}-campaign-details`],
    queryFn: (id) => getCampaign(id),
    getName: (campaign) => campaign.name,
  },

  // Devnote: may feel a little awkward as it essentially creates two crumbs,
  // email name -> edit, with the email name crumb being useless. maybe can
  // combine the two into one crumb like edit 'email name' if thats better
  templates: {
    queryKey: (id) => [`${id}-email-template`],
    queryFn: (id) => getEmailTemplate(id),
    getName: (template) => template.name,
    // templates/{id} has no page, so link to the template's edit page instead
    href: (path) => `${path}/edit`,
  },

  // Devnote: branched from main and pretty sure theres no way to access this
  // page currently but leaving it here for future use
  applications: {
    // Deliberately not `application-${id}`: applicant-facing pages use that key
    // for getInProgressApplication, which returns different data
    queryKey: (id) => [`${id}-application-details`],
    queryFn: (id) => getApplication(id),
    getName: (application) => application.user.name,
  },
};

/**
 * A crumb after the root "Dashboard" crumb:
 * - `static`:  a fixed segment with a label in SEGMENT_LABELS
 * - `entity`:  an ID segment whose name is fetched with `resolver`
 * - `unknown`: anything else, labelled with humanizeSegment
 */
export type BreadcrumbSegment =
  | { kind: "static"; segment: string; href: string }
  | { kind: "entity"; segment: string; href: string; resolver: EntityResolver }
  | { kind: "unknown"; segment: string; href: string };

export interface ParsedBreadcrumbPath {
  // link for the root "Dashboard" crumb (the org's dashboard home). 
  rootHref: string;
  // crumbs after the root, in URL order. 
  segments: BreadcrumbSegment[];
}

/** Fallback label for segments we don't recognise: `some-new_page` → `Some new page`. */
export function humanizeSegment(segment: string): string {
  const words = decodeURIComponent(segment).replace(/[-_]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Splits a dashboard pathname into crumbs.
 * Returns null outside an organisation (e.g. `/login`), where no breadcrumb is shown.
 */
export function parseBreadcrumbPath(pathname: string): ParsedBreadcrumbPath | null {
  const parts = pathname.split("/").filter(Boolean);

  // Keep any locale prefix so crumb links stay in the current language
  const localePrefix = LOCALES.includes(parts[0]) ? `/${parts.shift()}` : "";

  // The org ID comes right after "organisation". Without one, this isn't an org page.
  const orgIndex = parts.indexOf("organisation");
  if (orgIndex === -1 || orgIndex + 1 >= parts.length) return null;

  const rootHref = `${localePrefix}/${parts.slice(0, orgIndex + 2).join("/")}`;
  const pageSegments = parts.slice(orgIndex + 2);

  const segments = pageSegments.map((segment, i): BreadcrumbSegment => {
    // Each crumb links to the URL up to and including its own segment
    const href = `${rootHref}/${pageSegments.slice(0, i + 1).join("/")}`;

    // Fixed labels are checked first, so `campaigns/new` shows "New"
    // instead of looking up a campaign with the ID "new"
    if (Object.hasOwn(SEGMENT_LABELS, segment)) {
      return { kind: "static", segment, href };
    }

    const parent = pageSegments[i - 1];
    if (parent && Object.hasOwn(ENTITY_RESOLVERS, parent)) {
      const resolver = ENTITY_RESOLVERS[parent];
      return { kind: "entity", segment, href: resolver.href?.(href) ?? href, resolver };
    }

    return { kind: "unknown", segment, href };
  });

  return { rootHref, segments };
}
