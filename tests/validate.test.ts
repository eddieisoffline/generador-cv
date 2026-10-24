import { describe, expect, it } from "vitest";
import { dateRange, displayUrl, fileStem, linkTarget } from "../src/lib/format";
import { issueCounts, validateBullet } from "../src/lib/validate";
import { emptyProfile } from "../src/model/profile";

describe("validateBullet", () => {
  // Same cases as streamlit-app/validators/bullet_validator.py.
  it.each([
    ["", ["v_empty"]],
    ["   ", ["v_empty"]],
    ["Automated weekly reports", []],
    ["Automaticé reportes semanales", []],
    ["• Led a team of five", []],
    ["Diseñé tableros.", ["v_punctuation"]],
    ["I built a dashboard", ["v_first_person", "v_verb"]],
    ["Mis tareas incluían reportes", ["v_first_person", "v_verb"]],
    ["Misión cumplida en plazo", ["v_verb"]],
    ["Worked on reports;", ["v_verb", "v_punctuation"]],
    [`Built ${"x".repeat(240)}`, ["v_long"]],
  ])("%j → %j", (text, issues) => {
    expect(validateBullet(text)).toEqual(issues);
  });

  it("counts issues per section and per entry", () => {
    const profile = emptyProfile();
    profile.experience = [
      { role: "", company: "", location: "", start_date: "", end_date: "", bullets: ["Built it", "did stuff."] },
    ];
    expect(issueCounts(profile)).toEqual({ experience: 2, "experience[0]": 2 });
  });
});

describe("format", () => {
  it("joins dates and shortens links", () => {
    expect(dateRange(" 2020 ", "")).toBe("2020");
    expect(dateRange("2020", "2022")).toBe("2020 – 2022");
    expect(displayUrl("https://www.Example.com/me/")).toBe("Example.com/me");
    expect(linkTarget("linkedin.com/in/ada")).toBe("https://linkedin.com/in/ada");
    expect(linkTarget("http://a.example")).toBe("http://a.example");
  });

  it("derives a download name from the person's name", () => {
    expect(fileStem("Ana Rodríguez Núñez")).toBe("cv-ana-rodriguez-nunez");
    expect(fileStem("  ")).toBe("cv");
  });
});
