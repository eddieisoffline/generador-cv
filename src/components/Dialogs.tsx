/** Settings, privacy, confirmation and download dialogs. */

import { t } from "../i18n";
import type { Locale } from "../model/profile";
import { Icon } from "./icons";
import { Callout, Modal, Segmented } from "./ui";

export type Theme = "system" | "light" | "dark";

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  theme: Theme;
  onLocale: (locale: Locale) => void;
  onTheme: (theme: Theme) => void;
}

/** Choices apply at once and live only in memory, like everything else. */
export function SettingsDialog({ open, onClose, locale, theme, onLocale, onTheme }: SettingsProps) {
  return (
    <Modal open={open} title={t(locale, "settings")} onClose={onClose} closeLabel={t(locale, "close")}>
      <div className="cv-field">
        <span className="cv-field__label">{t(locale, "interface_language")}</span>
        <Segmented
          label={t(locale, "interface_language")}
          value={locale}
          options={[
            { value: "es", label: "Español" },
            { value: "en", label: "English" },
          ]}
          onChange={onLocale}
        />
      </div>
      <div className="cv-field">
        <span className="cv-field__label">{t(locale, "theme")}</span>
        <Segmented
          label={t(locale, "theme")}
          value={theme}
          options={[
            { value: "system", label: t(locale, "theme_system") },
            { value: "light", label: t(locale, "theme_light") },
            { value: "dark", label: t(locale, "theme_dark") },
          ]}
          onChange={onTheme}
        />
      </div>
    </Modal>
  );
}

export function PrivacyDialog({ open, onClose, locale }: { open: boolean; onClose: () => void; locale: Locale }) {
  return (
    <Modal open={open} title={t(locale, "privacy_title")} onClose={onClose} closeLabel={t(locale, "close")}>
      <ul className="cv-points">
        {(["privacy_1", "privacy_2", "privacy_3", "privacy_4"] as const).map((key) => (
          <li key={key}>
            <Icon name="check_circle" />
            <span>{t(locale, key)}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  locale: Locale;
}

export function ConfirmDialog({ open, title, text, confirmLabel, onConfirm, onClose, locale }: ConfirmProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      closeLabel={t(locale, "close")}
      footer={
        <>
          <button type="button" className="cv-btn cv-btn--ghost" onClick={onClose}>{t(locale, "cancel")}</button>
          <button type="button" className="cv-btn cv-btn--danger" onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <p className="cv-muted" style={{ margin: 0 }}>{text}</p>
    </Modal>
  );
}

interface ExportProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  busy: "pdf" | "docx" | null;
  error: string;
  hasHidden: boolean;
  onPdf: () => void;
  onDocx: () => void;
}

export function ExportDialog({ open, onClose, locale, busy, error, hasHidden, onPdf, onDocx }: ExportProps) {
  return (
    <Modal open={open} title={t(locale, "exports")} onClose={onClose} closeLabel={t(locale, "close")} wide>
      <p className="cv-muted cv-small" style={{ margin: 0 }}>{t(locale, "exports_hint")}</p>
      {error && <Callout tone="danger" icon="error">{error}</Callout>}
      <div className="cv-exports">
        <article className="cv-export cv-export--recommended">
          <div className="cv-export__top">
            <span className="cv-export__format">PDF</span>
            <span className="cv-badge cv-badge--pen">{t(locale, "recommended")}</span>
          </div>
          <h3 className="cv-export__title">{t(locale, "pdf_title")}</h3>
          <p className="cv-export__desc">{t(locale, "pdf_desc")}</p>
          <button type="button" className="cv-btn cv-btn--primary cv-btn--block" disabled={busy !== null} onClick={onPdf}>
            <Icon name="picture_as_pdf" />
            {busy === "pdf" ? t(locale, "building") : t(locale, "download_pdf")}
          </button>
        </article>
        <article className="cv-export">
          <div className="cv-export__top">
            <span className="cv-export__format">DOCX</span>
            <span className="cv-badge cv-badge--success">{t(locale, "keep_editing")}</span>
          </div>
          <h3 className="cv-export__title">{t(locale, "docx")}</h3>
          <p className="cv-export__desc">{t(locale, "docx_desc")}</p>
          {hasHidden && <p className="cv-export__desc"><strong>{t(locale, "docx_hidden_note")}</strong></p>}
          <button type="button" className="cv-btn cv-btn--secondary cv-btn--block" disabled={busy !== null} onClick={onDocx}>
            <Icon name="download" />
            {busy === "docx" ? t(locale, "building") : t(locale, "download_docx")}
          </button>
        </article>
      </div>
    </Modal>
  );
}
