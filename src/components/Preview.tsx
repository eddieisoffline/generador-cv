/** The live CV sheet, drawn from the same layout as the PDF and Word file. */

import { Fragment } from "react";
import { buildDocument, type DocLine } from "../document/layout";
import { t } from "../i18n";
import type { Locale, Profile } from "../model/profile";
import type { SectionKey } from "../model/sections";

function Line({ line }: { line: DocLine }) {
  switch (line.kind) {
    case "line":
      return (
        <p className="cv-paper__line">
          <span>{line.bold && line.left ? <b>{line.left}</b> : line.left}</span>
          <span>{line.right}</span>
        </p>
      );
    case "text":
      return (
        <p>
          {line.label && <b>{line.label}: </b>}
          {line.text}
        </p>
      );
    case "link":
      return <p>{line.text}</p>;
    case "bullets":
      return (
        <ul>
          {line.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
  }
}

export function Paper({ profile, liveSection, emptyText }: { profile: Profile; liveSection?: SectionKey; emptyText: string }) {
  const document = buildDocument(profile);
  if (document.empty) {
    return (
      <article className="cv-paper">
        <div className="cv-paper__empty">{emptyText}</div>
      </article>
    );
  }
  return (
    <article className="cv-paper" lang={document.locale}>
      <div data-live={liveSection === "personal" || undefined}>
        <p className="cv-paper__name">{document.name}</p>
        <div className="cv-paper__rule" />
        {document.contact.length > 0 && (
          <p className="cv-paper__contact">
            {document.contact.map((item, index) => (
              <Fragment key={index}>
                {index > 0 && " • "}
                {item.text}
              </Fragment>
            ))}
          </p>
        )}
      </div>
      {document.sections.map((section) => (
        <div key={section.key} data-live={liveSection === section.key || undefined}>
          <p className="cv-paper__section">{section.title}</p>
          {section.entries.map((entry, index) => (
            <div className="cv-paper__entry" key={index}>
              {entry.map((line, lineIndex) => (
                <Line key={lineIndex} line={line} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </article>
  );
}

export function Preview({ profile, section, locale }: { profile: Profile; section: SectionKey; locale: Locale }) {
  return (
    <section className="cv-preview cv-sticky" aria-label={t(locale, "live")}>
      <div className="cv-preview__bar">
        <span className="cv-badge cv-badge--pen">
          <span className="cv-badge__dot" />
          {t(locale, "live")}
        </span>
        <span className="cv-preview__meta">{t(locale, "preview_meta")}</span>
      </div>
      <div className="cv-well">
        <Paper profile={profile} liveSection={section} emptyText={t(locale, "preview_empty")} />
      </div>
    </section>
  );
}
