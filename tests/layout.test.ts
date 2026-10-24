import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildDocument } from "../src/document/layout";
import { emptyProfile, fromDict, setVisibility } from "../src/model/profile";

const legacy = () =>
  fromDict(JSON.parse(readFileSync(new URL("./fixtures/legacy-input.json", import.meta.url), "utf8")));

describe("buildDocument", () => {
  it("is empty for a new profile, with the CV fallback name", () => {
    const document = buildDocument(emptyProfile());
    expect(document.empty).toBe(true);
    expect(document.name).toBe("CV");
    expect(document.sections).toEqual([]);
  });

  it("follows the export order and skips hidden sections", () => {
    const document = buildDocument(legacy());
    expect(document.sections.map((section) => section.key)).toEqual([
      "education", "experience", "leadership_activities", "skills", "volunteer_experience",
    ]);
    expect(document.sections[0].title).toBe("Educación");
  });

  it("builds the contact line with links", () => {
    const { contact } = buildDocument(legacy());
    expect(contact).toEqual([
      { text: "Lima, Perú", href: "" },
      { text: "ada@example.com", href: "mailto:ada@example.com" },
      { text: "ada.example", href: "https://www.ada.example/" },
      { text: "linkedin.com/in/ada", href: "https://linkedin.com/in/ada" },
    ]);
  });

  it("lays out an experience entry like the Streamlit exports", () => {
    const experience = buildDocument(legacy()).sections.find((section) => section.key === "experience")!;
    expect(experience.entries).toEqual([
      [
        { kind: "line", left: "Acme", right: "Remote", bold: true },
        { kind: "line", left: "Analyst", right: "01/2022", bold: true },
        { kind: "bullets", items: ["Automated weekly reports", "Reduced costs by 10%."] },
      ],
    ]);
  });

  it("titles the skills block by what it holds", () => {
    const profile = { ...emptyProfile("en"), skills: [{ category: "Tools", items: ["Python", "SQL"] }] };
    expect(buildDocument(profile).sections[0]).toEqual({
      key: "skills",
      title: "Skills",
      entries: [[{ kind: "text", text: "Python, SQL", label: "Tools" }]],
    });
    const withLanguages = { ...profile, languages: ["Spanish"] };
    expect(buildDocument(withLanguages).sections[0].title).toBe("Skills & Interests");
    const hidden = setVisibility(withLanguages, ["languages"], false);
    expect(buildDocument(hidden).sections[0].title).toBe("Skills");
  });

  it("drops entries that have nothing to show", () => {
    const profile = { ...emptyProfile(), awards: [{ name: "", issuer: "", date: "", url: "", description: "", details: [] }] };
    expect(buildDocument(profile).sections).toEqual([]);
  });
});
