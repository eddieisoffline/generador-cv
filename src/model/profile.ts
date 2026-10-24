/**
 * The CV data model. It holds only what the person types; nothing here is
 * stored anywhere but in memory, and `exportableProfile` is all that ever
 * leaves the editor (inside the Word file the person downloads).
 *
 * Field names stay snake_case so profiles from the Streamlit version (and the
 * data embedded in a downloaded Word file) read without a mapping layer.
 */

export type Locale = "en" | "es";

export interface Contact {
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  start_date: string;
  end_date: string;
  details: string[];
}

export interface Experience {
  role: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  bullets: string[];
}

export interface LeadershipActivity {
  title: string;
  organization: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  bullets: string[];
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface Project {
  name: string;
  description: string;
  url: string;
  technologies: string[];
  bullets: string[];
}

export interface VolunteerExperience {
  role: string;
  organization: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  bullets: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  expiry_date: string;
  credential_id: string;
  url: string;
  description: string;
  details: string[];
}

export interface Award {
  name: string;
  issuer: string;
  date: string;
  url: string;
  description: string;
  details: string[];
}

export interface Publication {
  title: string;
  authors: string;
  publisher: string;
  date: string;
  url: string;
  description: string;
}

export interface Profile {
  name: string;
  contact: Contact;
  education: Education[];
  experience: Experience[];
  leadership_activities: LeadershipActivity[];
  skills: SkillGroup[];
  languages: string[];
  interests: string[];
  projects: Project[];
  volunteer_experience: VolunteerExperience[];
  certifications: Certification[];
  awards: Award[];
  publications: Publication[];
  /** Empty means every section is visible, as in the Streamlit version. */
  active_sections: string[];
  locale: Locale;
}

export interface EntryTypes {
  education: Education;
  experience: Experience;
  leadership_activities: LeadershipActivity;
  skills: SkillGroup;
  projects: Project;
  volunteer_experience: VolunteerExperience;
  certifications: Certification;
  awards: Award;
  publications: Publication;
}

export type EntryKey = keyof EntryTypes;
export type AnyEntry = EntryTypes[EntryKey];

/** Keys that `active_sections` can switch on or off. */
export const VISIBILITY_KEYS = [
  "experience", "education", "skills", "interests", "projects", "leadership_activities",
  "certifications", "awards", "publications", "volunteer_experience", "languages",
] as const;
export type VisibilityKey = (typeof VISIBILITY_KEYS)[number];

export const emptyContact = (): Contact => ({
  email: "", phone: "", location: "", website: "", linkedin: "", github: "",
});

export const ENTRY_FACTORIES: { [K in EntryKey]: () => EntryTypes[K] } = {
  education: () => ({ degree: "", institution: "", location: "", start_date: "", end_date: "", details: [] }),
  experience: () => ({ role: "", company: "", location: "", start_date: "", end_date: "", bullets: [] }),
  leadership_activities: () => ({
    title: "", organization: "", location: "", start_date: "", end_date: "", description: "", bullets: [],
  }),
  skills: () => ({ category: "", items: [] }),
  projects: () => ({ name: "", description: "", url: "", technologies: [], bullets: [] }),
  volunteer_experience: () => ({
    role: "", organization: "", location: "", start_date: "", end_date: "", description: "", bullets: [],
  }),
  certifications: () => ({
    name: "", issuer: "", date: "", expiry_date: "", credential_id: "", url: "", description: "", details: [],
  }),
  awards: () => ({ name: "", issuer: "", date: "", url: "", description: "", details: [] }),
  publications: () => ({ title: "", authors: "", publisher: "", date: "", url: "", description: "" }),
};

export function emptyProfile(locale: Locale = "es"): Profile {
  return {
    name: "",
    contact: emptyContact(),
    education: [],
    experience: [],
    leadership_activities: [],
    skills: [],
    languages: [],
    interests: [],
    projects: [],
    volunteer_experience: [],
    certifications: [],
    awards: [],
    publications: [],
    active_sections: [],
    locale,
  };
}

// ── Reading untrusted data (embedded Word data, legacy profile JSON) ─────────
// A port of CVProfile.from_dict in streamlit-app/models/cv_model.py, including
// the legacy field aliases, so both versions read the same input the same way.

type Mapping = Record<string, unknown>;

const isMapping = (value: unknown): value is Mapping =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Python's `str(value or "")`. */
function text(value: unknown): string {
  if (value === undefined || value === null || value === false || value === 0 || value === "") return "";
  if (Array.isArray(value) && value.length === 0) return "";
  if (isMapping(value) && Object.keys(value).length === 0) return "";
  return String(value);
}

/** The first key present (Python's nested `data.get(a, data.get(b, ...))`). */
function pick(data: Mapping, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in data) return data[key];
  }
  return undefined;
}

function strings(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (typeof value === "string") {
    return value.split(/\r\n|\r|\n/).map((item) => item.trim()).filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  const single = String(value).trim();
  return single ? [single] : [];
}

function records(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isMapping(value)) return [value];
  return [];
}

function mappings(value: unknown): Mapping[] {
  return records(value).map((item) => (isMapping(item) ? item : {}));
}

function bullets(value: unknown): string[] {
  return records(value).map((item) => text(isMapping(item) ? item.text ?? "" : item));
}

function sectionValues(value: unknown): string[] {
  if (isMapping(value)) return Object.keys(value).filter((key) => Boolean(value[key]));
  return strings(value);
}

function skillGroups(value: unknown): SkillGroup[] {
  if (typeof value === "string") return [{ category: "", items: strings(value) }];
  const groups: SkillGroup[] = [];
  for (const item of records(value)) {
    if (isMapping(item)) {
      groups.push({ category: text(item.category), items: strings(item.items ?? []) });
    } else if (String(item).trim()) {
      groups.push({ category: "", items: [String(item).trim()] });
    }
  }
  return groups;
}

function certification(value: unknown): Certification {
  if (!isMapping(value)) return { ...ENTRY_FACTORIES.certifications(), name: text(value) };
  return {
    name: text(pick(value, "name", "title", "credential") ?? ""),
    issuer: text(pick(value, "issuer", "organization") ?? ""),
    date: text(pick(value, "date", "issue_date") ?? ""),
    expiry_date: text(value.expiry_date),
    credential_id: text(pick(value, "credential_id", "id") ?? ""),
    url: text(pick(value, "url", "credential_url") ?? ""),
    description: text(value.description),
    details: strings(value.details ?? []),
  };
}

function award(value: unknown): Award {
  if (!isMapping(value)) return { ...ENTRY_FACTORIES.awards(), name: text(value) };
  return {
    name: text(pick(value, "name", "title") ?? ""),
    issuer: text(pick(value, "issuer", "organization") ?? ""),
    date: text(value.date),
    url: text(value.url),
    description: text(value.description),
    details: strings(value.details ?? []),
  };
}

export function fromDict(input: unknown): Profile {
  const data = isMapping(input) ? input : {};
  const contact = isMapping(data.contact) ? data.contact : {};
  const locale = text(data.locale);
  return {
    name: text(data.name),
    contact: {
      email: text(contact.email),
      phone: text(contact.phone),
      location: text(contact.location),
      website: text(contact.website),
      linkedin: text(contact.linkedin),
      github: text(contact.github),
    },
    experience: mappings(data.experience).map((item) => ({
      role: text(item.role),
      company: text(item.company),
      location: text(item.location),
      start_date: text(item.start_date),
      end_date: text(item.end_date),
      bullets: bullets(item.bullets),
    })),
    education: mappings(data.education).map((item) => ({
      degree: text(item.degree),
      institution: text(item.institution),
      location: text(item.location),
      start_date: text(item.start_date),
      end_date: text(item.end_date),
      details: strings(item.details ?? []),
    })),
    skills: skillGroups(data.skills),
    projects: mappings(data.projects).map((item) => ({
      name: text(item.name),
      description: text(item.description),
      url: text(item.url),
      technologies: strings(item.technologies ?? []),
      bullets: bullets(item.bullets),
    })),
    languages: strings(data.languages ?? []),
    interests: strings(pick(data, "interests", "skills_interests") ?? []),
    leadership_activities: mappings(
      pick(data, "leadership_activities", "leadership", "leadership_and_activities", "activities"),
    ).map((item) => ({
      title: text(pick(item, "title", "role") ?? ""),
      organization: text(pick(item, "organization", "company") ?? ""),
      location: text(item.location),
      start_date: text(item.start_date),
      end_date: text(item.end_date),
      description: text(item.description),
      bullets: bullets(item.bullets),
    })),
    certifications: records(data.certifications).map(certification),
    awards: records(data.awards).map(award),
    publications: mappings(data.publications).map((item) => {
      const authors = Array.isArray(item.authors) ? item.authors.map(String).join(", ") : item.authors;
      return {
        title: text(pick(item, "title", "name") ?? ""),
        authors: text(authors),
        publisher: text(item.publisher),
        date: text(item.date),
        url: text(item.url),
        description: text(item.description),
      };
    }),
    volunteer_experience: mappings(pick(data, "volunteer_experience", "volunteering", "volunteer")).map(
      (item) => ({
        role: text(pick(item, "role", "title") ?? ""),
        organization: text(pick(item, "organization", "company") ?? ""),
        location: text(item.location),
        start_date: text(item.start_date),
        end_date: text(item.end_date),
        description: text(item.description),
        bullets: bullets(item.bullets),
      }),
    ),
    active_sections: sectionValues(data.active_sections ?? []),
    locale: locale === "es" ? "es" : "en",
  };
}

// ── Visibility ───────────────────────────────────────────────────────────────

const SECTION_ALIASES: Record<string, string> = {
  leadership: "leadership_activities",
  activities: "leadership_activities",
  leadership_and_activities: "leadership_activities",
  volunteer: "volunteer_experience",
  skills_and_interests: "skills",
};

const normalizeSection = (value: string) => value.toLowerCase().replaceAll("&", "and").replaceAll(" ", "_");

/** Port of CVProfile.section_is_active. */
export function sectionIsActive(profile: Profile, section: string): boolean {
  if (profile.active_sections.length === 0) return true;
  const normalized = normalizeSection(section);
  const raw = new Set(profile.active_sections.map(normalizeSection));
  if ((normalized === "skills" || normalized === "interests") && raw.has("skills_and_interests")) return true;
  const selected = new Set([...raw].map((item) => SECTION_ALIASES[item] ?? item));
  return selected.has(SECTION_ALIASES[normalized] ?? normalized);
}

export function setVisibility(profile: Profile, keys: readonly VisibilityKey[], visible: boolean): Profile {
  const active = new Set(VISIBILITY_KEYS.filter((key) => sectionIsActive(profile, key)));
  for (const key of keys) {
    if (visible) active.add(key);
    else active.delete(key);
  }
  const all = active.size === VISIBILITY_KEYS.length;
  return { ...profile, active_sections: all ? [] : VISIBILITY_KEYS.filter((key) => active.has(key)) };
}

/**
 * What goes into the downloaded Word file: only what the CV shows. Hidden
 * sections are dropped, so nothing travels to a recruiter that the person
 * did not choose to show.
 */
export function exportableProfile(profile: Profile): Profile {
  const visible = (key: VisibilityKey) => sectionIsActive(profile, key);
  return {
    name: profile.name,
    contact: { ...profile.contact },
    education: visible("education") ? structuredClone(profile.education) : [],
    experience: visible("experience") ? structuredClone(profile.experience) : [],
    leadership_activities: visible("leadership_activities") ? structuredClone(profile.leadership_activities) : [],
    skills: visible("skills") ? structuredClone(profile.skills) : [],
    languages: visible("languages") ? [...profile.languages] : [],
    interests: visible("interests") ? [...profile.interests] : [],
    projects: visible("projects") ? structuredClone(profile.projects) : [],
    volunteer_experience: visible("volunteer_experience") ? structuredClone(profile.volunteer_experience) : [],
    certifications: visible("certifications") ? structuredClone(profile.certifications) : [],
    awards: visible("awards") ? structuredClone(profile.awards) : [],
    publications: visible("publications") ? structuredClone(profile.publications) : [],
    active_sections: [],
    locale: profile.locale,
  };
}

export function hasContent(profile: Profile): boolean {
  const { contact } = profile;
  return Boolean(
    profile.name.trim() ||
      Object.values(contact).some((value) => value.trim()) ||
      VISIBILITY_KEYS.some((key) => (profile[key] as unknown[]).length > 0),
  );
}
