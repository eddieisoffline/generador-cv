/**
 * Turns site.config.ts into what search engines and social networks read:
 * per-page meta tags (canonical, Open Graph, hreflang, icons), the JSON-LD of
 * the home page, the shared header and footer of the static pages, and
 * sitemap.xml and robots.txt. The pure functions are exported for tests.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { HtmlTagDescriptor, Plugin } from "vite";
import { LEGAL_LINKS, PAGES, SITE, type Lang, type PageDef } from "../site.config";

type Env = Record<string, string | undefined>;

const escape = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/**
 * The public origin: SITE_URL when set, else the production domain Vercel
 * exposes at build time (custom or .vercel.app), else the local preview.
 */
export function resolveSiteUrl(env: Env): string {
  const production = env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = env.SITE_URL || (production ? `https://${production}` : "http://localhost:4173");
  return url.replace(/\/+$/, "");
}

/** The page an HTML request or entry belongs to ("/en/privacy.html", "/privacidad", "/"). */
export function pageFor(requestPath: string): PageDef | undefined {
  let file = requestPath.split(/[?#]/)[0].replace(/^\/+/, "");
  if (!file || file.endsWith("/")) file += "index.html";
  if (!file.endsWith(".html")) file += ".html";
  return PAGES.find((page) => page.file === file);
}

const pageUrl = (siteUrl: string, path: string) => (path === "/" ? `${siteUrl}/` : `${siteUrl}${path}`);
const ogLocale = (lang: Lang) => (lang === "es" ? "es_ES" : "en_US");

export function headTags(page: PageDef, siteUrl: string, verification = ""): HtmlTagDescriptor[] {
  const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: "meta", attrs, injectTo: "head" });
  const link = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: "link", attrs, injectTo: "head" });
  const url = pageUrl(siteUrl, page.path);
  const image = `${siteUrl}${SITE.ogImage.path}`;
  const tags: HtmlTagDescriptor[] = [
    { tag: "title", children: page.title, injectTo: "head" },
    meta({ name: "description", content: page.description }),
    meta({ name: "theme-color", content: SITE.themeColor.light, media: "(prefers-color-scheme: light)" }),
    meta({ name: "theme-color", content: SITE.themeColor.dark, media: "(prefers-color-scheme: dark)" }),
    link({ rel: "icon", href: "/favicon.ico", sizes: "32x32" }),
    link({ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }),
    link({ rel: "apple-touch-icon", href: "/apple-touch-icon.png" }),
    link({ rel: "manifest", href: "/site.webmanifest" }),
  ];
  if (!page.index) {
    tags.push(meta({ name: "robots", content: "noindex" }));
    return tags;
  }
  tags.push(
    link({ rel: "canonical", href: url }),
    meta({ property: "og:type", content: "website" }),
    meta({ property: "og:site_name", content: SITE.name[page.lang] }),
    meta({ property: "og:title", content: page.title }),
    meta({ property: "og:description", content: page.description }),
    meta({ property: "og:url", content: url }),
    meta({ property: "og:locale", content: ogLocale(page.lang) }),
    meta({ property: "og:image", content: image }),
    meta({ property: "og:image:width", content: String(SITE.ogImage.width) }),
    meta({ property: "og:image:height", content: String(SITE.ogImage.height) }),
    meta({ property: "og:image:alt", content: SITE.name[page.lang] }),
    meta({ name: "twitter:card", content: "summary_large_image" }),
  );
  if (page.alternate) {
    const other = page.lang === "es" ? "en" : "es";
    const spanish = page.lang === "es" ? page.path : page.alternate;
    tags.push(
      meta({ property: "og:locale:alternate", content: ogLocale(other) }),
      link({ rel: "alternate", hreflang: page.lang, href: url }),
      link({ rel: "alternate", hreflang: other, href: pageUrl(siteUrl, page.alternate) }),
      link({ rel: "alternate", hreflang: "x-default", href: pageUrl(siteUrl, spanish) }),
    );
  }
  if (verification) tags.push(meta({ name: "google-site-verification", content: verification }));
  if (page.path === "/") {
    const data = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE.name.es,
      alternateName: SITE.name.en,
      url,
      description: page.description,
      image,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      inLanguage: ["es", "en"],
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    };
    tags.push({
      tag: "script",
      attrs: { type: "application/ld+json" },
      children: JSON.stringify(data).replaceAll("<", "\\u003c"),
      injectTo: "head",
    });
  }
  return tags;
}

export function sitemapXml(siteUrl: string): string {
  const urls = PAGES.filter((page) => page.index).map((page) => {
    const parts = [`<loc>${escape(pageUrl(siteUrl, page.path))}</loc>`];
    if (page.path !== "/") parts.push(`<lastmod>${SITE.legalUpdated.iso}</lastmod>`);
    if (page.alternate) {
      const other = page.lang === "es" ? "en" : "es";
      parts.push(
        `<xhtml:link rel="alternate" hreflang="${page.lang}" href="${escape(pageUrl(siteUrl, page.path))}"/>`,
        `<xhtml:link rel="alternate" hreflang="${other}" href="${escape(pageUrl(siteUrl, page.alternate))}"/>`,
      );
    }
    return `  <url>${parts.join("")}</url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export function robotsTxt(siteUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

// ── Shared header and footer of the static pages ────────────────────────────

const BRAND_ICON = (() => {
  const svg = readFileSync(new URL("../node_modules/@material-symbols/svg-400/rounded/description.svg", import.meta.url), "utf8");
  const path = /\sd="([^"]+)"/.exec(svg)?.[1] ?? "";
  return `<svg class="cv-icon" viewBox="0 -960 960 960" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
})();

const HEADER_TEXT: Record<Lang, { open: string; home: string }> = {
  es: { open: "Abrir el generador", home: "Inicio" },
  en: { open: "Open the generator", home: "Home" },
};

export function siteHeader(lang: Lang): string {
  return (
    `<header class="pg-header"><a class="pg-brand" href="/" aria-label="${escape(`${SITE.name[lang]} · ${HEADER_TEXT[lang].home}`)}">` +
    `${BRAND_ICON}<span>${escape(SITE.name[lang])}</span></a>` +
    `<a class="cv-btn cv-btn--primary cv-btn--sm" href="/">${escape(HEADER_TEXT[lang].open)}</a></header>`
  );
}

function legalNav(lang: Lang, current: string, label: string): string {
  const links = LEGAL_LINKS[lang].map(
    (item) => `<a href="${item.path}"${item.path === current ? ' aria-current="page"' : ""}>${escape(item.label)}</a>`,
  );
  return `<nav class="pg-footer__nav" aria-label="${escape(label)}" lang="${lang}">${links.join("")}</nav>`;
}

export function siteFooter(page: PageDef): string {
  const contact = page.lang === "es" ? "Contacto" : "Contact";
  const parts = [legalNav(page.lang, page.path, page.lang === "es" ? "Textos legales" : "Legal")];
  if (page.alternate) {
    const other = page.lang === "es" ? "en" : "es";
    const text = other === "en" ? "Read in English" : "Leer en español";
    parts.push(`<p><a href="${page.alternate}" hreflang="${other}" lang="${other}">${text}</a></p>`);
  } else if (!page.index) {
    // The 404 page is bilingual, so it links both sets.
    parts.push(legalNav("en", page.path, "Legal"));
  }
  const source = page.lang === "es" ? "Código abierto (licencia MIT)" : "Open source (MIT licence)";
  parts.push(`<p>${contact}: <a href="mailto:${SITE.email}">${SITE.email}</a> · <a href="${SITE.repository}">${source}</a></p>`);
  return `<footer class="pg-footer">${parts.join("")}</footer>`;
}

// ── The plugin ───────────────────────────────────────────────────────────────

export function sitePlugin(env: Env = process.env): Plugin {
  const siteUrl = resolveSiteUrl(env);
  const verification = env.GOOGLE_SITE_VERIFICATION ?? "";
  return {
    name: "cv-site",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const page = pageFor(ctx.path);
        if (!page) return html;
        const filled = html
          .replace("<!--site:header-->", siteHeader(page.lang))
          .replace("<!--site:footer-->", siteFooter(page))
          .replaceAll("%SITE_EMAIL%", SITE.email)
          .replaceAll("%SITE_UPDATED%", SITE.legalUpdated[page.lang]);
        return { html: filled, tags: headTags(page, siteUrl, verification) };
      },
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemapXml(siteUrl) });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robotsTxt(siteUrl) });
    },
  };
}

/** The HTML entries for Rollup, from the page list. */
export function pageInputs(root: URL): Record<string, string> {
  return Object.fromEntries(PAGES.map((page) => [page.file.replace(/\.html$/, ""), fileURLToPath(new URL(page.file, root))]));
}
