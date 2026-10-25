import { LEGAL_LINKS } from "../../site.config";
import { t } from "../i18n";
import type { Locale } from "../model/profile";

/**
 * Links to the legal pages. Inside the editor they open in a new tab, so
 * following one never closes the tab that holds the CV.
 */
export function LegalLinks({ locale, newTab = false, className = "" }: { locale: Locale; newTab?: boolean; className?: string }) {
  return (
    <nav className={`cv-legal ${className}`} aria-label={t(locale, "legal_nav")}>
      {LEGAL_LINKS[locale].map((link) => (
        <a key={link.path} href={link.path} {...(newTab ? { target: "_blank", rel: "noopener" } : {})}>
          {link.label}
          {newTab && <span className="cv-visually-hidden"> ({t(locale, "new_tab")})</span>}
        </a>
      ))}
    </nav>
  );
}
