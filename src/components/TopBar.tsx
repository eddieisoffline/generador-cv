import { t } from "../i18n";
import type { Locale } from "../model/profile";
import { Icon } from "./icons";
import { Menu } from "./ui";

interface TopBarProps {
  locale: Locale;
  name: string;
  dirty: boolean;
  downloaded: boolean;
  onSections: () => void;
  onPrivacy: () => void;
  onSettings: () => void;
  onNew: () => void;
  onOpen: () => void;
  onExport: () => void;
}

export function TopBar({ locale, name, dirty, downloaded, onSections, onPrivacy, onSettings, onNew, onOpen, onExport }: TopBarProps) {
  return (
    <header className="cv-topbar">
      <button type="button" className="cv-btn cv-btn--ghost cv-btn--icon cv-topbar__sections" aria-label={t(locale, "sections_menu")} onClick={onSections}>
        <Icon name="menu" />
      </button>
      <div className="cv-topbar__app">
        <Icon name="description" />
        <span>{t(locale, "app_name")}</span>
      </div>
      <span className="cv-topbar__sep" aria-hidden="true" />
      <Menu
        label={t(locale, "cv_menu")}
        align="left"
        items={[
          { label: t(locale, "new_cv"), icon: "restart_alt", onSelect: onNew },
          { label: t(locale, "open_word"), icon: "upload_file", onSelect: onOpen },
        ]}
        trigger={(props) => (
          <button type="button" className="cv-btn cv-btn--ghost" style={{ minWidth: 0, paddingInline: "12px 8px", gap: 4 }} aria-label={`${t(locale, "cv_menu")}: ${name || t(locale, "new_cv")}`} {...props}>
            <span className={`cv-topbar__name${name ? "" : " cv-topbar__name--empty"}`}>{name || t(locale, "new_cv")}</span>
            <Icon name="keyboard_arrow_down" />
          </button>
        )}
      />
      <span className="cv-topbar__status">
        {downloaded && !dirty ? (
          <span className="cv-badge cv-badge--success">
            <Icon name="check" />
            {t(locale, "status_downloaded")}
          </span>
        ) : (
          <span className="cv-badge cv-badge--warning">
            <span className="cv-badge__dot" />
            {t(locale, "status_pending")}
          </span>
        )}
      </span>
      <span className="cv-topbar__spacer" />
      <div className="cv-topbar__actions">
        <button type="button" className="cv-badge cv-badge--pen cv-topbar__status" onClick={onPrivacy}>
          <Icon name="shield_lock" />
          {t(locale, "privacy_badge")}
        </button>
        <button type="button" className="cv-btn cv-btn--ghost cv-btn--icon" aria-label={t(locale, "settings")} title={t(locale, "settings")} onClick={onSettings}>
          <Icon name="settings" />
        </button>
        <button type="button" className="cv-btn cv-btn--primary cv-btn--label-wide" aria-label={t(locale, "export")} onClick={onExport}>
          <Icon name="download" />
          <span className="cv-btn__label">{t(locale, "export")}</span>
        </button>
      </div>
    </header>
  );
}
