import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  VISIBILITY_KEYS, emptyProfile, exportableProfile, fromDict, hasContent, sectionIsActive, setVisibility,
} from "../src/model/profile";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

describe("fromDict", () => {
  // The expected output comes from the Streamlit model (CVProfile.from_dict),
  // so both versions read legacy aliases and loose values the same way.
  const expected = read("./fixtures/legacy-expected.json");
  const profile = fromDict(read("./fixtures/legacy-input.json"));

  it("matches the Python model, field by field", () => {
    expect(profile).toEqual(expected.profile);
  });

  it("matches the Python visibility rules", () => {
    for (const key of VISIBILITY_KEYS) {
      expect(sectionIsActive(profile, key), key).toBe(expected.active[key]);
    }
  });

  it("reads the starter examples", () => {
    for (const name of ["data_analyst", "data_engineer"]) {
      const example = fromDict(read(`../streamlit-app/examples/${name}.json`));
      expect(example.name).toBe("YOUR NAME");
      expect(example.skills.length).toBeGreaterThan(0);
    }
  });

  it("turns anything that is not an object into an empty profile", () => {
    for (const value of [null, 3, "text", [1, 2]]) {
      expect(fromDict(value)).toEqual({ ...emptyProfile("en") });
    }
  });
});

describe("visibility", () => {
  it("keeps an empty list when every section is visible again", () => {
    const hidden = setVisibility(emptyProfile(), ["projects"], false);
    expect(hidden.active_sections).not.toContain("projects");
    expect(setVisibility(hidden, ["projects"], true).active_sections).toEqual([]);
  });

  it("drops hidden sections from what is exported", () => {
    const profile = {
      ...emptyProfile(),
      name: "Ada",
      projects: [{ name: "Secret", description: "", url: "", technologies: [], bullets: [] }],
      interests: ["Chess"],
    };
    const hidden = setVisibility(profile, ["projects", "interests"], false);
    const exported = exportableProfile(hidden);
    expect(exported.projects).toEqual([]);
    expect(exported.interests).toEqual([]);
    expect(exported.active_sections).toEqual([]);
    expect(exported.name).toBe("Ada");
  });
});

describe("hasContent", () => {
  it("is false for a new profile and true once something is typed", () => {
    expect(hasContent(emptyProfile())).toBe(false);
    expect(hasContent({ ...emptyProfile(), name: "Ada" })).toBe(true);
  });
});
