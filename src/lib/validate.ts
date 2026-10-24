/**
 * Structural checks for CV bullets (port of streamlit-app/validators/
 * bullet_validator.py). They never judge whether a bullet is true; they only
 * flag shape problems for the author to review.
 */

import type { Profile } from "../model/profile";

export const BULLET_LIMIT = 240;

export type IssueKey = "v_empty" | "v_long" | "v_first_person" | "v_verb" | "v_punctuation";

const ACTION_WORDS = new Set([
  "built", "created", "designed", "developed", "delivered", "drove",
  "improved", "increased", "launched", "led", "managed", "reduced",
  "automated", "analyzed", "implemented", "optimized", "owned",
  "construí", "creé", "diseñé", "desarrollé", "entregué", "lideré",
  "gestioné", "reduje", "automaticé", "analicé", "implementé",
  "optimicé",
]);

export function validateBullet(value: string): IssueKey[] {
  const text = value.trim();
  if (!text) return ["v_empty"];
  const issues: IssueKey[] = [];
  if (text.length > BULLET_LIMIT) issues.push("v_long");
  if (/^(i|yo|me|my|mi|mis)(?![\p{L}\p{N}_])/iu.test(text)) issues.push("v_first_person");
  const firstWord = text.replace(/^[^A-Za-zÀ-ÿ]+/, "").split(" ", 1)[0].toLowerCase();
  if (!ACTION_WORDS.has(firstWord)) issues.push("v_verb");
  if (text.endsWith(".") || text.endsWith(";")) issues.push("v_punctuation");
  return issues;
}

const BULLET_SECTIONS = ["experience", "projects", "leadership_activities", "volunteer_experience"] as const;

/**
 * Issue counts keyed by section ("experience") and by entry ("experience[0]"),
 * like _issue_counts in the Streamlit app.
 */
export function issueCounts(profile: Profile): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const section of BULLET_SECTIONS) {
    profile[section].forEach((entry, index) => {
      for (const bullet of entry.bullets) {
        const found = validateBullet(bullet).length;
        if (!found) continue;
        counts[section] = (counts[section] ?? 0) + found;
        counts[`${section}[${index}]`] = (counts[`${section}[${index}]`] ?? 0) + found;
      }
    });
  }
  return counts;
}
