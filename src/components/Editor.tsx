/** The editor panel: one section at a time, like the Streamlit version. */

import type { Dispatch } from "react";
import { t, type MessageKey } from "../i18n";
import { dateRange } from "../lib/format";
import { BULLET_LIMIT, issueCounts, validateBullet } from "../lib/validate";
import {
  sectionIsActive, type AnyEntry, type Contact, type EntryKey, type Locale, type Profile, type VisibilityKey,
} from "../model/profile";
import { CV_SECTIONS, ENTRY_SPECS, sectionByKey, type FieldSpec, type Section } from "../model/sections";
import type { Action, State } from "../state";
import { Icon } from "./icons";
import { AreaField, LinesField, Menu, Segmented, TextField, Toggle } from "./ui";

interface EditorProps {
  state: State;
  dispatch: Dispatch<Action>;
  locale: Locale;
}

export function Editor({ state, dispatch, locale }: EditorProps) {
  const { profile } = state;
  const section = sectionByKey(state.section);
  const edit = (next: Profile) => dispatch({ type: "edit", profile: next });
  return (
    <main id="editor" className="cv-editor" tabIndex={-1} aria-labelledby="section-title">
      <SectionHeader section={section} state={state} dispatch={dispatch} locale={locale} />
      {section.key === "personal" ? (
        <Personal profile={profile} onChange={edit} locale={locale} />
      ) : (
        <Entries section={section.key} state={state} dispatch={dispatch} locale={locale} />
      )}
      {section.key === "skills" && <SkillExtras profile={profile} dispatch={dispatch} locale={locale} />}
    </main>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

function SectionHeader({ section, state, dispatch, locale }: EditorProps & { section: Section }) {
  const all = [sectionByKey("personal"), ...CV_SECTIONS];
  const visible = section.visibility.some((key) => sectionIsActive(state.profile, key));
  const hasEntries = section.key !== "personal" && state.profile[section.key].length > 0;
  return (
    <header className="cv-section-head">
      <div className="cv-section-head__text">
        <p className="cv-overline">{t(locale, "section_of", { n: all.indexOf(section) + 1, total: all.length })}</p>
        <h1 id="section-title" className="cv-display">{t(locale, section.label)}</h1>
        <p className="cv-section-head__desc">{t(locale, `desc_${section.key}` as MessageKey)}</p>
      </div>
      {section.visibility.length > 0 && (
        <div className="cv-section-head__actions">
          <Toggle
            label={t(locale, "show_in_cv")}
            checked={visible}
            onChange={(value) => dispatch({ type: "visibility", keys: section.visibility, visible: value })}
          />
          {hasEntries && (
            <button
              type="button"
              className="cv-btn cv-btn--secondary cv-btn--sm"
              onClick={() => dispatch({ type: "add-entry", section: section.key as EntryKey })}
            >
              <Icon name="add" />
              {t(locale, `add_${section.key}` as MessageKey)}
            </button>
          )}
        </div>
      )}
    </header>
  );
}

// ── Personal details ─────────────────────────────────────────────────────────

const CONTACT_ROWS: [keyof Contact, keyof Contact][] = [
  ["email", "phone"],
  ["location", "website"],
  ["linkedin", "github"],
];
const CONTACT_TYPES: Partial<Record<keyof Contact, "email" | "tel" | "url">> = {
  email: "email", phone: "tel", website: "url", linkedin: "url", github: "url",
};

function Personal({ profile, onChange, locale }: { profile: Profile; onChange: (profile: Profile) => void; locale: Locale }) {
  const setContact = (field: keyof Contact, value: string) =>
    onChange({ ...profile, contact: { ...profile.contact, [field]: value } });
  return (
    <div className="cv-stack">
      <TextField
        label={t(locale, "f_full_name")}
        value={profile.name}
        placeholder={t(locale, "ph_name")}
        autoComplete="name"
        onChange={(value) => onChange({ ...profile, name: value })}
      />
      {CONTACT_ROWS.map((row) => (
        <div className="cv-field-row" key={row.join()}>
          {row.map((field) => (
            <TextField
              key={field}
              label={t(locale, `f_${field}` as MessageKey)}
              value={profile.contact[field]}
              type={CONTACT_TYPES[field]}
              placeholder={t(locale, `ph_${field}` as MessageKey)}
              onChange={(value) => setContact(field, value)}
            />
          ))}
        </div>
      ))}
      <div className="cv-field">
        <span className="cv-field__label">{t(locale, "cv_language")}</span>
        <Segmented
          label={t(locale, "cv_language")}
          value={profile.locale}
          options={[
            { value: "es", label: t(locale, "spanish") },
            { value: "en", label: t(locale, "english") },
          ]}
          onChange={(value) => onChange({ ...profile, locale: value })}
        />
        <p className="cv-field__hint">{t(locale, "cv_language_hint")}</p>
      </div>
    </div>
  );
}

// ── Repeatable entries ───────────────────────────────────────────────────────

function Entries({ section, state, dispatch, locale }: EditorProps & { section: EntryKey }) {
  const items = state.profile[section] as AnyEntry[];
  const meta = sectionByKey(section);
  const issues = issueCounts(state.profile);

  if (!items.length) {
    return (
      <div className="cv-empty">
        <span className="cv-empty__icon"><Icon name={meta.icon} /></span>
        <h2 className="cv-display cv-display--sm">{t(locale, `empty_${section}` as MessageKey)}</h2>
        <p className="cv-empty__text">{t(locale, `empty_${section}_text` as MessageKey)}</p>
        <p className="cv-empty__example">
          <span className="cv-muted">{t(locale, "example")}</span> {t(locale, `example_${section}` as MessageKey)}
        </p>
        <div className="cv-empty__actions">
          <button type="button" className="cv-btn cv-btn--primary" onClick={() => dispatch({ type: "add-entry", section })}>
            <Icon name="add" />
            {t(locale, `add_${section}` as MessageKey)}
          </button>
        </div>
      </div>
    );
  }

  const setItem = (index: number, item: AnyEntry) => {
    const next = [...items];
    next[index] = item;
    dispatch({ type: "edit", profile: { ...state.profile, [section]: next } });
  };

  return (
    <div>
      {items.map((item, index) => (
        <EntryCard
          key={index}
          section={section}
          item={item}
          index={index}
          count={items.length}
          issues={issues[`${section}[${index}]`] ?? 0}
          open={state.openEntry?.section === section && state.openEntry.index === index}
          onToggle={(open) => dispatch({ type: "open", entry: open ? { section, index } : null })}
          onChange={(next) => setItem(index, next)}
          dispatch={dispatch}
          locale={locale}
        />
      ))}
      <div className="cv-add-row">
        <button type="button" className="cv-btn cv-btn--secondary" onClick={() => dispatch({ type: "add-entry", section })}>
          <Icon name="add" />
          {t(locale, `add_${section}` as MessageKey)}
        </button>
      </div>
    </div>
  );
}

interface EntryCardProps {
  section: EntryKey;
  item: AnyEntry;
  index: number;
  count: number;
  issues: number;
  open: boolean;
  onToggle: (open: boolean) => void;
  onChange: (item: AnyEntry) => void;
  dispatch: Dispatch<Action>;
  locale: Locale;
}

function EntryCard({ section, item, index, count, issues, open, onToggle, onChange, dispatch, locale }: EntryCardProps) {
  const spec = ENTRY_SPECS[section];
  const record = item as unknown as Record<string, unknown>;
  const title = String(record[spec.title] ?? "").trim() || `${t(locale, "untitled")} ${index + 1}`;
  const meta = spec.subtitle.map((field) => String(record[field] ?? "").trim()).filter(Boolean);
  const dates = "start_date" in record
    ? dateRange(String(record.start_date), String(record.end_date))
    : String(record.date ?? "").trim();
  if (dates) meta.push(dates);
  const bullets = "bullets" in item ? item.bullets : [];

  return (
    <details
      className="cv-entry"
      open={open}
      onToggle={(event) => {
        const next = (event.currentTarget as HTMLDetailsElement).open;
        if (next !== open) onToggle(next);
      }}
    >
      <summary className="cv-entry__head">
        <div style={{ minWidth: 0 }}>
          <p className="cv-entry__title">{title}</p>
          {meta.length > 0 && <p className="cv-entry__meta">{meta.join(" · ")}</p>}
        </div>
        <div className="cv-entry__badges">
          {spec.bullets && bullets.length > 0 && (
            <span className="cv-badge">
              {bullets.length === 1 ? t(locale, "bullet_count_one") : t(locale, "bullet_count", { n: bullets.length })}
            </span>
          )}
          {issues > 0 && (
            <span className="cv-badge cv-badge--warning">
              <Icon name="error" />
              {t(locale, "to_review", { n: issues })}
            </span>
          )}
        </div>
        <Icon name="keyboard_arrow_down" className="cv-entry__chevron" />
      </summary>
      {open && (
        <div className="cv-entry__body">
          {spec.rows.map((row, rowIndex) => (
            <div key={rowIndex} className={`cv-field-row${row.length === 1 ? " cv-field-row--1" : row.length === 3 ? " cv-field-row--3" : ""}`}>
              {row.map((field) => (
                <EntryField key={field.attribute} field={field} record={record} onChange={(value) => onChange({ ...item, [field.attribute]: value } as AnyEntry)} locale={locale} />
              ))}
            </div>
          ))}
          {spec.bullets && "bullets" in item && (
            <BulletEditor
              base={`${section}-${index}`}
              bullets={item.bullets}
              onChange={(next) => onChange({ ...item, bullets: next } as AnyEntry)}
              locale={locale}
            />
          )}
          <div className="cv-entry__foot">
            <button type="button" className="cv-btn cv-btn--danger cv-btn--sm" onClick={() => dispatch({ type: "remove-entry", section, index })}>
              <Icon name="delete" />
              {t(locale, "remove_entry")}
            </button>
            <div className="cv-entry__foot-group">
              <button type="button" className="cv-btn cv-btn--ghost cv-btn--sm" disabled={index === 0} onClick={() => dispatch({ type: "move-entry", section, index, offset: -1 })}>
                <Icon name="arrow_upward" />
                {t(locale, "move_up")}
              </button>
              <button type="button" className="cv-btn cv-btn--ghost cv-btn--sm" disabled={index === count - 1} onClick={() => dispatch({ type: "move-entry", section, index, offset: 1 })}>
                <Icon name="arrow_downward" />
                {t(locale, "move_down")}
              </button>
              <button type="button" className="cv-btn cv-btn--ghost cv-btn--sm" onClick={() => dispatch({ type: "duplicate-entry", section, index })}>
                <Icon name="content_copy" />
                {t(locale, "duplicate_entry")}
              </button>
            </div>
          </div>
        </div>
      )}
    </details>
  );
}

function EntryField({ field, record, onChange, locale }: { field: FieldSpec; record: Record<string, unknown>; onChange: (value: string | string[]) => void; locale: Locale }) {
  const label = t(locale, field.label);
  const placeholder = field.placeholder === "url" ? "https://" : field.placeholder ? t(locale, field.placeholder) : undefined;
  if (field.kind === "lines") {
    return <LinesField label={label} value={(record[field.attribute] as string[]) ?? []} placeholder={placeholder} onChange={onChange} />;
  }
  if (field.kind === "area") {
    return <AreaField label={label} value={String(record[field.attribute] ?? "")} placeholder={placeholder} onChange={onChange} />;
  }
  return (
    <TextField
      label={label}
      value={String(record[field.attribute] ?? "")}
      placeholder={placeholder}
      type={field.placeholder === "url" ? "url" : "text"}
      onChange={onChange}
    />
  );
}

// ── Bullets ──────────────────────────────────────────────────────────────────

function BulletEditor({ base, bullets, onChange, locale }: { base: string; bullets: string[]; onChange: (bullets: string[]) => void; locale: Locale }) {
  const set = (index: number, value: string) => onChange(bullets.map((bullet, i) => (i === index ? value : bullet)));
  const move = (index: number, offset: -1 | 1) => {
    const next = [...bullets];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  };
  return (
    <div className="cv-bullets">
      <div className="cv-bullets__head">
        <p className="cv-bullets__title">{t(locale, "bullet_editor")}</p>
        <p className="cv-bullets__hint">{t(locale, "bullet_editor_hint")}</p>
      </div>
      {bullets.map((bullet, index) => {
        const id = `bullet-${base}-${index}`;
        const issues = validateBullet(bullet);
        const length = bullet.trim().length;
        return (
          <div className="cv-bullet" key={index}>
            <div className="cv-bullet__row">
              <label className="cv-visually-hidden" htmlFor={id}>{t(locale, "bullet_n", { n: index + 1 })}</label>
              <textarea
                id={id}
                className="cv-input"
                rows={2}
                value={bullet}
                placeholder={t(locale, "ph_bullet")}
                aria-describedby={`${id}-meta`}
                onChange={(event) => set(index, event.target.value)}
              />
              <Menu
                label={t(locale, "more_actions")}
                items={[
                  { label: t(locale, "move_up"), icon: "arrow_upward", disabled: index === 0, onSelect: () => move(index, -1) },
                  { label: t(locale, "move_down"), icon: "arrow_downward", disabled: index === bullets.length - 1, onSelect: () => move(index, 1) },
                  { label: t(locale, "remove_bullet"), icon: "delete", danger: true, onSelect: () => onChange(bullets.filter((_, i) => i !== index)) },
                ]}
                trigger={(props) => (
                  <button type="button" className="cv-btn cv-btn--ghost cv-btn--icon cv-btn--sm" aria-label={`${t(locale, "more_actions")}: ${t(locale, "bullet_n", { n: index + 1 })}`} {...props}>
                    <Icon name="more_horiz" />
                  </button>
                )}
              />
            </div>
            <div className="cv-bullet__meta" id={`${id}-meta`}>
              {issues.map((issue) => (
                <span key={issue} className="cv-bullet__issue">
                  <Icon name="error" size="sm" />
                  {t(locale, issue)}
                </span>
              ))}
              <span className={`cv-bullet__count${length > BULLET_LIMIT ? " cv-bullet__count--over" : ""}`}>
                {length}/{BULLET_LIMIT}
              </span>
            </div>
          </div>
        );
      })}
      <div>
        <button type="button" className="cv-btn cv-btn--ghost cv-btn--sm" onClick={() => onChange([...bullets, ""])}>
          <Icon name="add" />
          {t(locale, "add_bullet")}
        </button>
      </div>
    </div>
  );
}

// ── Languages and interests (inside Skills) ──────────────────────────────────

function SkillExtras({ profile, dispatch, locale }: { profile: Profile; dispatch: Dispatch<Action>; locale: Locale }) {
  const fields: ("languages" | "interests")[] = ["languages", "interests"];
  return (
    <>
      {fields.map((field) => (
        <section className="cv-group" key={field} aria-labelledby={`group-${field}`}>
          <div className="cv-group__head">
            <h2 id={`group-${field}`} className="cv-group__title">{t(locale, field)}</h2>
            <Toggle
              label={t(locale, "show_in_cv")}
              checked={sectionIsActive(profile, field)}
              onChange={(value) => dispatch({ type: "visibility", keys: [field as VisibilityKey], visible: value })}
            />
          </div>
          <LinesField
            label={t(locale, `f_${field}`)}
            value={profile[field]}
            placeholder={t(locale, `ph_${field}`)}
            onChange={(value) => dispatch({ type: "edit", profile: { ...profile, [field]: value } })}
          />
        </section>
      ))}
    </>
  );
}
