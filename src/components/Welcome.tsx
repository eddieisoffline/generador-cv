/** The first screen: start a new CV or continue from a downloaded Word file. */

import { useState } from "react";
import { t } from "../i18n";
import type { Locale } from "../model/profile";
import { Icon } from "./icons";
import { LegalLinks } from "./LegalLinks";
import { Callout } from "./ui";

interface WelcomeProps {
  locale: Locale;
  error: string;
  onStart: () => void;
  onOpen: () => void;
  onFile: (file: File) => void;
  onPrivacy: () => void;
  onSettings: () => void;
}

export function Welcome({ locale, error, onStart, onOpen, onFile, onPrivacy, onSettings }: WelcomeProps) {
  const [dragging, setDragging] = useState(false);
  return (
    <main className="cv-welcome">
      <div
        className="cv-welcome__card"
        data-dragging={dragging}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) onFile(file);
        }}
      >
        <div className="cv-welcome__words">
          <p className="cv-welcome__brand">
            <Icon name="description" />
            {t(locale, "app_name")}
          </p>
          <h1 className="cv-welcome__title">{t(locale, "welcome_title")}</h1>
          <p className="cv-welcome__text">{t(locale, "welcome_text")}</p>
          <div className="cv-welcome__actions">
            <button type="button" className="cv-btn cv-btn--primary cv-btn--lg" onClick={onStart}>
              <Icon name="add" />
              {t(locale, "start_new")}
            </button>
            <button type="button" className="cv-btn cv-btn--secondary cv-btn--lg" onClick={onOpen}>
              <Icon name="upload_file" />
              {t(locale, "continue_word")}
            </button>
          </div>
          <p className="cv-welcome__drop">{dragging ? t(locale, "drop_here") : t(locale, "drop_hint")}</p>
          {error && (
            <div className="cv-welcome__error">
              <Callout tone="danger" icon="error">{error}</Callout>
            </div>
          )}
          <p className="cv-welcome__privacy">
            <Icon name="shield_lock" />
            <span>
              {t(locale, "privacy_short")}{" "}
              <button type="button" onClick={onPrivacy}>{t(locale, "privacy_title")}</button>
            </span>
          </p>
        </div>
        <div className="cv-welcome__art" aria-hidden="true">
          <WelcomeArt />
        </div>
        <div className="cv-welcome__settings">
          <button type="button" className="cv-btn cv-btn--secondary cv-btn--icon" aria-label={t(locale, "settings")} title={t(locale, "settings")} onClick={onSettings}>
            <Icon name="settings" />
          </button>
        </div>
      </div>
      <LegalLinks locale={locale} className="cv-welcome__legal" />
    </main>
  );
}

/** The cover motif of the design system: the CV sheet as a pen-blue slab. */
function WelcomeArt() {
  // [x, y, width] of each text line on the sheet: name, contact, then
  // centred headings, entry lines with dates on the right, and bullets.
  const lines: [number, number, number][] = [
    [130, 52, 80], [146, 84, 48],
    [140, 116, 60], [88, 136, 72], [212, 136, 40], [104, 154, 140], [104, 172, 120], [104, 190, 132],
    [140, 222, 60], [88, 242, 64], [212, 242, 40], [104, 260, 128], [104, 278, 100], [104, 296, 136],
    [140, 328, 60], [88, 348, 150], [88, 366, 120],
  ];
  return (
    <svg viewBox="0 0 360 440" preserveAspectRatio="xMidYMid slice">
      <rect className="cv-art__soft" x="24" y="330" width="120" height="120" rx="16" />
      <rect className="cv-art__ink" x="236" y="190" width="180" height="230" rx="24" />
      <rect className="cv-art__pen" x="60" y="20" width="220" height="370" rx="24" />
      <rect className="cv-art__line" x="88" y="70" width="164" height="2" />
      {lines.map(([x, y, width], index) => (
        <rect key={index} className="cv-art__line" x={x} y={y} width={width} height="8" rx="4" />
      ))}
    </svg>
  );
}
