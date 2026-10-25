/**
 * Everything the public pages say about the site, in one place: contact, the
 * date of the legal texts, and each page's URL, language, title and
 * description. The Vite plugin (vite/site-plugin.ts) turns it into meta tags,
 * the sitemap and robots.txt; the app reads the legal links from here too.
 */

export type Lang = "es" | "en";

export const SITE = {
  name: { es: "Generador de CV", en: "CV Generator" },
  /** The only contact published, as chosen by the owner. */
  email: "e.ddieag451@outlook.com",
  /** When the legal texts last changed (not the build date). */
  legalUpdated: { iso: "2026-10-25", es: "25 de octubre de 2026", en: "25 October 2026" },
  themeColor: { light: "#f3f1ec", dark: "#131312" },
  ogImage: { path: "/og-image.jpg", width: 1200, height: 630 },
} as const;

export interface PageDef {
  /** The HTML entry, relative to the project root. */
  file: string;
  /** The public URL path (Vercel's cleanUrls drops ".html"). */
  path: string;
  lang: Lang;
  title: string;
  description: string;
  /** The same page in the other language, if there is one. */
  alternate?: string;
  /** False keeps the page out of the sitemap and search results. */
  index: boolean;
}

export const PAGES: readonly PageDef[] = [
  {
    file: "index.html",
    path: "/",
    lang: "es",
    title: "Generador de CV gratis y privado · Crea tu CV en el navegador",
    description:
      "Crea tu CV por secciones, míralo al instante y descárgalo en PDF o Word. Gratis, sin registrarte y sin que tus datos salgan de tu navegador.",
    index: true,
  },
  {
    file: "aviso-legal.html",
    path: "/aviso-legal",
    lang: "es",
    alternate: "/en/legal-notice",
    title: "Aviso legal · Generador de CV",
    description: "Quién ofrece el Generador de CV, sus condiciones de uso y la legislación aplicable.",
    index: true,
  },
  {
    file: "privacidad.html",
    path: "/privacidad",
    lang: "es",
    alternate: "/en/privacy",
    title: "Política de privacidad · Generador de CV",
    description:
      "Qué datos se tratan al usar el Generador de CV: tu CV no sale de tu navegador; solo el alojamiento registra datos técnicos de conexión.",
    index: true,
  },
  {
    file: "cookies.html",
    path: "/cookies",
    lang: "es",
    alternate: "/en/cookies",
    title: "Política de cookies · Generador de CV",
    description: "El Generador de CV no usa cookies ni guarda nada en tu navegador; por eso no hay banner de cookies.",
    index: true,
  },
  {
    file: "en/legal-notice.html",
    path: "/en/legal-notice",
    lang: "en",
    alternate: "/aviso-legal",
    title: "Legal notice · CV Generator",
    description: "Who provides the CV Generator, its terms of use and the applicable law.",
    index: true,
  },
  {
    file: "en/privacy.html",
    path: "/en/privacy",
    lang: "en",
    alternate: "/privacidad",
    title: "Privacy policy · CV Generator",
    description:
      "What data is processed when you use the CV Generator: your CV never leaves your browser; only the host logs technical connection data.",
    index: true,
  },
  {
    file: "en/cookies.html",
    path: "/en/cookies",
    lang: "en",
    alternate: "/cookies",
    title: "Cookie policy · CV Generator",
    description: "The CV Generator uses no cookies and stores nothing in your browser, so there is no cookie banner.",
    index: true,
  },
  {
    file: "404.html",
    path: "/404",
    lang: "es",
    title: "Página no encontrada · Generador de CV",
    description: "Esta página no existe. Vuelve al Generador de CV para crear tu currículum.",
    index: false,
  },
];

/** Footer links to the legal pages, per interface language. */
export const LEGAL_LINKS: Record<Lang, { label: string; path: string }[]> = {
  es: [
    { label: "Aviso legal", path: "/aviso-legal" },
    { label: "Privacidad", path: "/privacidad" },
    { label: "Cookies", path: "/cookies" },
  ],
  en: [
    { label: "Legal notice", path: "/en/legal-notice" },
    { label: "Privacy", path: "/en/privacy" },
    { label: "Cookies", path: "/en/cookies" },
  ],
};
