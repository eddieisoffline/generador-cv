/**
 * One layout for the preview, the PDF and the Word file. `buildDocument` turns
 * a profile into lines (the Harvard-style bullet resume of the Streamlit
 * version: centred headings, locations and dates flushed right), and each
 * renderer only draws those lines. What the preview shows is what exports.
 */

import { t } from "../i18n";
import { dateRange, displayUrl, joinNonEmpty, linkTarget } from "../lib/format";
import { sectionIsActive, type Locale, type Profile } from "../model/profile";
import type { SectionKey } from "../model/sections";

export type DocLine =
  /** Left text (bold unless stated) with the right text flushed right. */
  | { kind: "line"; left: string; right: string; bold: boolean }
  /** A paragraph, optionally led by a bold "Label:". */
  | { kind: "text"; text: string; label: string }
  | { kind: "link"; text: string; href: string }
  | { kind: "bullets"; items: string[] };

export interface DocSection {
  /** The editor section it comes from, so the preview can outline it. */
  key: SectionKey;
  title: string;
  /** Each entry is a group of lines; entries are separated by one blank line. */
  entries: DocLine[][];
}

export interface ContactItem {
  text: string;
  href: string;
}

export interface CVDocument {
  locale: Locale;
  name: string;
  contact: ContactItem[];
  sections: DocSection[];
  /** True when there is nothing to show yet (no name, contact or sections). */
  empty: boolean;
}

const line = (left: string, right = "", bold = true): DocLine[] =>
  left.trim() || right.trim() ? [{ kind: "line", left: left.trim(), right: right.trim(), bold }] : [];

const text = (value: string, label = ""): DocLine[] =>
  value.trim() || label.trim() ? [{ kind: "text", text: value.trim(), label: label.trim() }] : [];

const link = (url: string): DocLine[] =>
  url.trim() ? [{ kind: "link", text: displayUrl(url), href: linkTarget(url) }] : [];

const bullets = (values: string[]): DocLine[] => {
  const items = values.map((value) => value.trim()).filter(Boolean);
  return items.length ? [{ kind: "bullets", items }] : [];
};

function dated(
  title: string, organization: string, location: string, start: string, end: string,
  description: string, items: string[],
): DocLine[] {
  return [...line(organization, location), ...line(title, dateRange(start, end)), ...text(description), ...bullets(items)];
}

export function buildDocument(profile: Profile): CVDocument {
  const { locale, contact } = profile;
  const heading = (key: Parameters<typeof t>[1]) => t(locale, key);
  const active = (key: string) => sectionIsActive(profile, key);
  const sections: DocSection[] = [];

  function add<T>(key: SectionKey, visible: boolean, items: T[], render: (item: T) => DocLine[]) {
    if (!visible) return;
    const entries = items.map(render).filter((entry) => entry.length > 0);
    if (entries.length) sections.push({ key, title: heading(key as Parameters<typeof t>[1]), entries });
  }

  // Section order follows the template of the Streamlit exports.
  add("education", active("education"), profile.education, (item) => [
    ...line(item.institution, item.location),
    ...line(item.degree, dateRange(item.start_date, item.end_date), false),
    ...item.details.flatMap((detail) => text(detail)),
  ]);
  add("experience", active("experience"), profile.experience, (item) => [
    ...line(item.company, item.location),
    ...line(item.role, dateRange(item.start_date, item.end_date)),
    ...bullets(item.bullets),
  ]);
  add("leadership_activities", active("leadership_activities"), profile.leadership_activities, (item) =>
    dated(item.title, item.organization, item.location, item.start_date, item.end_date, item.description, item.bullets),
  );

  // Skills, languages and interests share one block; its title says so.
  const skillLines = active("skills")
    ? profile.skills
        .filter((group) => group.category.trim() || group.items.length)
        .flatMap((group) => text(group.items.join(", "), group.category))
    : [];
  const extra = [
    ...(profile.languages.length && active("languages") ? text(profile.languages.join(", "), heading("languages")) : []),
    ...(profile.interests.length && active("interests") ? text(profile.interests.join(", "), heading("interests")) : []),
  ];
  if (skillLines.length || extra.length) {
    sections.push({
      key: "skills",
      title: heading(extra.length ? "skills_interests" : "skills"),
      entries: [[...skillLines, ...extra]],
    });
  }

  add("projects", active("projects"), profile.projects, (item) => [
    ...line(item.name),
    ...text(item.description),
    ...text(item.technologies.join(", ")),
    ...link(item.url),
    ...bullets(item.bullets),
  ]);
  add("volunteer_experience", active("volunteer_experience"), profile.volunteer_experience, (item) =>
    dated(item.role, item.organization, item.location, item.start_date, item.end_date, item.description, item.bullets),
  );
  add("certifications", active("certifications"), profile.certifications, (item) => [
    ...line(item.name, dateRange(item.date, item.expiry_date)),
    ...text(joinNonEmpty([item.issuer, item.credential_id])),
    ...text(item.description),
    ...link(item.url),
    ...bullets(item.details),
  ]);
  add("awards", active("awards"), profile.awards, (item) => [
    ...line(item.name, item.date),
    ...text(item.issuer),
    ...text(item.description),
    ...link(item.url),
    ...bullets(item.details),
  ]);
  add("publications", active("publications"), profile.publications, (item) => [
    ...line(item.title, item.date),
    ...text(joinNonEmpty([item.authors, item.publisher])),
    ...text(item.description),
    ...link(item.url),
  ]);

  const email = contact.email.trim();
  const contactItems: ContactItem[] = [
    { text: contact.location.trim(), href: "" },
    { text: email, href: email ? `mailto:${email}` : "" },
    { text: contact.phone.trim(), href: "" },
    ...[contact.website, contact.linkedin, contact.github].map((url) => ({
      text: displayUrl(url),
      href: linkTarget(url),
    })),
  ].filter((item) => item.text);

  const name = profile.name.trim();
  return {
    locale,
    name: name || "CV",
    contact: contactItems,
    sections,
    empty: !name && !contactItems.length && !sections.length,
  };
}
