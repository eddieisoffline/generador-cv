/** The editor's sections and how each repeatable entry is edited. */

import type { EntryKey, Profile, VisibilityKey } from "./profile";
import type { IconName } from "../components/icons";
import type { MessageKey } from "../i18n";

export type SectionKey = "personal" | EntryKey;

export interface Section {
  key: SectionKey;
  icon: IconName;
  label: MessageKey;
  visibility: readonly VisibilityKey[];
}

// The rail follows the export order so the editor and the sheet line up.
export const HEADER_SECTION: Section = { key: "personal", icon: "badge", label: "personal", visibility: [] };
export const CV_SECTIONS: readonly Section[] = [
  { key: "education", icon: "school", label: "education", visibility: ["education"] },
  { key: "experience", icon: "work", label: "experience", visibility: ["experience"] },
  {
    key: "leadership_activities", icon: "groups", label: "leadership_activities",
    visibility: ["leadership_activities"],
  },
  { key: "skills", icon: "psychology", label: "skills_interests", visibility: ["skills", "languages", "interests"] },
  { key: "projects", icon: "rocket_launch", label: "projects", visibility: ["projects"] },
  {
    key: "volunteer_experience", icon: "volunteer_activism", label: "volunteering",
    visibility: ["volunteer_experience"],
  },
  { key: "certifications", icon: "verified", label: "certifications", visibility: ["certifications"] },
  { key: "awards", icon: "military_tech", label: "awards", visibility: ["awards"] },
  { key: "publications", icon: "menu_book", label: "publications", visibility: ["publications"] },
];
export const ALL_SECTIONS: readonly Section[] = [HEADER_SECTION, ...CV_SECTIONS];

export const sectionByKey = (key: SectionKey): Section =>
  ALL_SECTIONS.find((section) => section.key === key) ?? HEADER_SECTION;

export type FieldKind = "text" | "area" | "lines";

export interface FieldSpec {
  attribute: string;
  label: MessageKey;
  kind: FieldKind;
  placeholder?: MessageKey | "url";
}

export interface EntrySpec {
  rows: FieldSpec[][];
  title: string;
  subtitle: string[];
  bullets: boolean;
}

const f = (attribute: string, label: MessageKey, kind: FieldKind = "text", placeholder?: FieldSpec["placeholder"]) =>
  ({ attribute, label, kind, placeholder }) satisfies FieldSpec;

const DATES = [
  f("location", "f_location", "text", "ph_location"),
  f("start_date", "f_start", "text", "ph_date"),
  f("end_date", "f_end", "text", "ph_end"),
];

export const ENTRY_SPECS: Record<EntryKey, EntrySpec> = {
  education: {
    rows: [[f("institution", "f_institution"), f("degree", "f_degree")], DATES, [f("details", "f_details", "lines", "ph_lines")]],
    title: "degree",
    subtitle: ["institution"],
    bullets: false,
  },
  experience: {
    rows: [[f("role", "f_role"), f("company", "f_company")], DATES],
    title: "role",
    subtitle: ["company", "location"],
    bullets: true,
  },
  leadership_activities: {
    rows: [[f("title", "f_title_role"), f("organization", "f_organization")], DATES, [f("description", "f_description", "area")]],
    title: "title",
    subtitle: ["organization", "location"],
    bullets: true,
  },
  skills: {
    rows: [[f("category", "f_category", "text", "ph_category")], [f("items", "f_skill_items", "lines", "ph_lines")]],
    title: "category",
    subtitle: [],
    bullets: false,
  },
  projects: {
    rows: [
      [f("name", "f_name"), f("url", "f_url", "text", "url")],
      [f("description", "f_description", "area")],
      [f("technologies", "f_technologies", "lines", "ph_lines")],
    ],
    title: "name",
    subtitle: ["url"],
    bullets: true,
  },
  volunteer_experience: {
    rows: [[f("role", "f_role"), f("organization", "f_organization")], DATES, [f("description", "f_description", "area")]],
    title: "role",
    subtitle: ["organization", "location"],
    bullets: true,
  },
  certifications: {
    rows: [
      [f("name", "f_name"), f("issuer", "f_issuer")],
      [f("date", "f_date", "text", "ph_date"), f("expiry_date", "f_expiry", "text", "ph_date"), f("credential_id", "f_credential_id")],
      [f("url", "f_url", "text", "url")],
      [f("description", "f_description", "area")],
      [f("details", "f_details", "lines", "ph_lines")],
    ],
    title: "name",
    subtitle: ["issuer"],
    bullets: false,
  },
  awards: {
    rows: [
      [f("name", "f_name"), f("issuer", "f_issuer")],
      [f("date", "f_date", "text", "ph_date"), f("url", "f_url", "text", "url")],
      [f("description", "f_description", "area")],
      [f("details", "f_details", "lines", "ph_lines")],
    ],
    title: "name",
    subtitle: ["issuer"],
    bullets: false,
  },
  publications: {
    rows: [
      [f("title", "f_title"), f("authors", "f_authors")],
      [f("publisher", "f_publisher"), f("date", "f_date", "text", "ph_date")],
      [f("url", "f_url", "text", "url")],
      [f("description", "f_description", "area")],
    ],
    title: "title",
    subtitle: ["publisher"],
    bullets: false,
  },
};

/** Entries a section holds, for the rail count. */
export function sectionCount(profile: Profile, key: SectionKey): number {
  if (key === "personal") return profile.name.trim() ? 1 : 0;
  if (key === "skills") return profile.skills.length + profile.languages.length + profile.interests.length;
  return profile[key].length;
}
