/** The section rail: every section in export order, with counts and the eye. */

import type { Dispatch } from "react";
import { t, type MessageKey } from "../i18n";
import { issueCounts } from "../lib/validate";
import { sectionIsActive, type Locale, type Profile } from "../model/profile";
import { CV_SECTIONS, HEADER_SECTION, sectionCount, type Section } from "../model/sections";
import type { Action, State } from "../state";
import { Icon } from "./icons";
import { LegalLinks } from "./LegalLinks";

interface RailProps {
  state: State;
  dispatch: Dispatch<Action>;
  locale: Locale;
  onNavigate: () => void;
  onPrivacy: () => void;
}

export function Rail({ state, dispatch, locale, onNavigate, onPrivacy }: RailProps) {
  const issues = issueCounts(state.profile);
  const row = (section: Section) => (
    <RailRow
      key={section.key}
      section={section}
      state={state}
      issues={issues[section.key] ?? 0}
      locale={locale}
      onGo={() => {
        dispatch({ type: "go", section: section.key });
        onNavigate();
      }}
      onToggle={(visible) => dispatch({ type: "visibility", keys: section.visibility, visible })}
    />
  );
  return (
    <nav className="cv-rail" aria-label={t(locale, "sections_menu")}>
      <p className="cv-overline">{t(locale, "rail_header")}</p>
      {row(HEADER_SECTION)}
      <p className="cv-overline">{t(locale, "rail_sections")}</p>
      {CV_SECTIONS.map(row)}
      <div className="cv-rail__footer">
        <Progress profile={state.profile} issues={issues} downloaded={state.downloaded} locale={locale} />
      </div>
      <p className="cv-rail__privacy">
        <button type="button" onClick={onPrivacy}>{t(locale, "privacy_badge")}</button>
        {" · "}
        {t(locale, "privacy_short")}
      </p>
      <LegalLinks locale={locale} newTab className="cv-rail__legal" />
    </nav>
  );
}

interface RailRowProps {
  section: Section;
  state: State;
  issues: number;
  locale: Locale;
  onGo: () => void;
  onToggle: (visible: boolean) => void;
}

function RailRow({ section, state, issues, locale, onGo, onToggle }: RailRowProps) {
  const current = state.section === section.key;
  const count = sectionCount(state.profile, section.key);
  const visible = !section.visibility.length || section.visibility.some((key) => sectionIsActive(state.profile, key));
  const label = t(locale, section.label);
  return (
    <div className="cv-rail__item" data-current={current} data-hidden={!visible} data-empty={count === 0}>
      <button type="button" className="cv-rail__link" aria-current={current ? "page" : undefined} onClick={onGo}>
        <Icon name={section.icon} filled={current} />
        <span className="cv-rail__label">{label}</span>
        {issues > 0 ? (
          <span className="cv-rail__count cv-rail__count--warn" title={t(locale, "to_review", { n: issues })}>
            {count}
            <span className="cv-visually-hidden">, {t(locale, "to_review", { n: issues })}</span>
          </span>
        ) : (
          <span className="cv-rail__count">{count}</span>
        )}
      </button>
      {section.visibility.length > 0 && (
        <button
          type="button"
          className="cv-rail__eye"
          aria-label={`${t(locale, visible ? "hide_in_cv" : "show_in_cv")}: ${label}`}
          title={t(locale, visible ? "hide_in_cv" : "show_in_cv")}
          onClick={() => onToggle(!visible)}
        >
          <Icon name={visible ? "visibility" : "visibility_off"} />
        </button>
      )}
    </div>
  );
}

function Progress({ profile, issues, downloaded, locale }: { profile: Profile; issues: Record<string, number>; downloaded: boolean; locale: Locale }) {
  const steps: [boolean, MessageKey][] = [
    [Boolean(profile.name.trim() && profile.contact.email.trim()), "step_contact"],
    [profile.education.length > 0, "step_education"],
    [profile.experience.length > 0, "step_experience"],
    [profile.experience.length > 0 && profile.experience.every((item) => item.bullets.length >= 3), "step_bullets"],
    [profile.skills.some((group) => group.items.length > 0), "step_skills"],
    [!Object.values(issues).some(Boolean), "step_review"],
    [
      (["projects", "leadership_activities", "volunteer_experience", "certifications", "awards", "publications"] as const)
        .some((key) => profile[key].length > 0),
      "step_extra",
    ],
    [downloaded, "step_download"],
  ];
  const done = steps.filter(([complete]) => complete).length;
  const pending = steps.find(([complete]) => !complete)?.[1];
  return (
    <div className="cv-progress">
      <div className="cv-progress__head">
        <span className="cv-progress__label">{t(locale, "progress_label")}</span>
        <span className="cv-progress__value">{t(locale, "progress_value", { done, total: steps.length })}</span>
      </div>
      <div className="cv-progress__track" aria-hidden="true">
        {steps.map(([complete], index) => (
          <span key={index} className="cv-progress__step" data-done={complete} />
        ))}
      </div>
      <p className="cv-progress__hint">
        {pending ? (
          <>
            {t(locale, "progress_next", { step: "\u0000" }).split("\u0000")[0]}
            <strong>{t(locale, pending)}</strong>
            {t(locale, "progress_next", { step: "\u0000" }).split("\u0000")[1]}
          </>
        ) : (
          t(locale, "progress_done")
        )}
      </p>
    </div>
  );
}
