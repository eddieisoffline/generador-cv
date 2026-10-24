import type { Locale } from "../model/profile";
import { en } from "./en";
import { es } from "./es";

export type MessageKey = keyof typeof en;

const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, es };

export function t(locale: Locale, key: MessageKey, vars: Record<string, string | number> = {}): string {
  const template = MESSAGES[locale][key] ?? en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** The interface language from the browser: Spanish for any "es-*", else English. */
export function browserLocale(): Locale {
  const first = typeof navigator === "undefined" ? "" : (navigator.languages?.[0] ?? navigator.language ?? "");
  return first.toLowerCase().startsWith("es") ? "es" : "en";
}
