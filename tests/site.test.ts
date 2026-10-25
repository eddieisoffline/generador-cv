import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LEGAL_LINKS, PAGES, SITE } from "../site.config";
import { es } from "../src/i18n/es";
import { en } from "../src/i18n/en";
import { headTags, pageFor, resolveSiteUrl, robotsTxt, siteFooter, sitemapXml } from "../vite/site-plugin";

const root = fileURLToPath(new URL("../", import.meta.url));
const URL_ = "https://cv.example";
const attrs = (tags: ReturnType<typeof headTags>) => tags.map((tag) => ({ tag: tag.tag, ...(tag.attrs as object) }));

describe("site URL", () => {
  it("prefers SITE_URL, then Vercel's production domain, then the local preview", () => {
    expect(resolveSiteUrl({ SITE_URL: "https://mi-cv.es/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe("https://mi-cv.es");
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "cv.vercel.app" })).toBe("https://cv.vercel.app");
    expect(resolveSiteUrl({})).toBe("http://localhost:4173");
  });
});

describe("pages", () => {
  it("exist as HTML entries with the shared header and footer", () => {
    for (const page of PAGES) {
      const html = readFileSync(join(root, page.file), "utf8");
      expect(html, page.file).toContain(`<html lang="${page.lang}">`);
      if (page.file !== "index.html") {
        expect(html, page.file).toContain("<!--site:header-->");
        expect(html, page.file).toContain("<!--site:footer-->");
        expect(html, page.file).not.toContain(SITE.email);
      }
    }
  });

  it("are found from request paths and entry paths", () => {
    expect(pageFor("/")?.file).toBe("index.html");
    expect(pageFor("/index.html")?.file).toBe("index.html");
    expect(pageFor("/privacidad")?.file).toBe("privacidad.html");
    expect(pageFor("/en/privacy.html?x=1")?.file).toBe("en/privacy.html");
    expect(pageFor("/nope")).toBeUndefined();
  });

  it("pair each legal page with its translation", () => {
    for (const page of PAGES.filter((item) => item.alternate)) {
      const other = PAGES.find((item) => item.path === page.alternate);
      expect(other, page.path).toBeDefined();
      expect(other!.alternate).toBe(page.path);
      expect(other!.lang).not.toBe(page.lang);
    }
  });

  it("keep titles and descriptions within what search results show", () => {
    for (const page of PAGES) {
      expect(page.title.length, page.title).toBeLessThanOrEqual(65);
      expect(page.description.length, page.description).toBeGreaterThan(50);
      expect(page.description.length, page.description).toBeLessThanOrEqual(160);
    }
  });

  it("give the app the same title the HTML has", () => {
    expect(es.doc_title).toBe(PAGES[0].title);
    expect(en.doc_title.length).toBeLessThanOrEqual(65);
  });

  it("link the app's footer to pages that exist", () => {
    for (const links of Object.values(LEGAL_LINKS)) {
      for (const link of links) expect(PAGES.some((page) => page.path === link.path), link.path).toBe(true);
    }
  });
});

describe("meta tags", () => {
  it("give a legal page its canonical, social tags and language alternates", () => {
    const tags = attrs(headTags(pageFor("/privacidad")!, URL_));
    expect(tags).toContainEqual({ tag: "link", rel: "canonical", href: `${URL_}/privacidad` });
    expect(tags).toContainEqual({ tag: "meta", property: "og:image", content: `${URL_}/og-image.jpg` });
    expect(tags).toContainEqual({ tag: "link", rel: "alternate", hreflang: "en", href: `${URL_}/en/privacy` });
    expect(tags).toContainEqual({ tag: "link", rel: "alternate", hreflang: "x-default", href: `${URL_}/privacidad` });
  });

  it("describe the home page as a free web application", () => {
    const script = headTags(pageFor("/")!, URL_).find((tag) => tag.tag === "script")!;
    const data = JSON.parse(String(script.children));
    expect(data["@type"]).toBe("WebApplication");
    expect(data.url).toBe(`${URL_}/`);
    expect(data.isAccessibleForFree).toBe(true);
  });

  it("keep the 404 page out of search results", () => {
    const tags = attrs(headTags(pageFor("/404")!, URL_));
    expect(tags).toContainEqual({ tag: "meta", name: "robots", content: "noindex" });
    expect(tags.some((tag) => "rel" in tag && tag.rel === "canonical")).toBe(false);
  });

  it("add the Search Console tag only when given", () => {
    const has = (verification: string) =>
      attrs(headTags(pageFor("/")!, URL_, verification)).some((tag) => "name" in tag && tag.name === "google-site-verification");
    expect(has("")).toBe(false);
    expect(has("abc123")).toBe(true);
  });

  it("put the contact email in the footer", () => {
    expect(siteFooter(pageFor("/aviso-legal")!)).toContain(`mailto:${SITE.email}`);
  });
});

describe("sitemap and robots", () => {
  it("lists every indexable page with its alternates, and not the 404", () => {
    const xml = sitemapXml(URL_);
    for (const page of PAGES.filter((item) => item.index)) {
      expect(xml).toContain(`<loc>${URL_}${page.path === "/" ? "/" : page.path}</loc>`);
    }
    expect(xml).not.toContain("/404");
    expect(xml).toContain(`hreflang="en" href="${URL_}/en/cookies"`);
  });

  it("points robots.txt at the sitemap", () => {
    expect(robotsTxt(URL_)).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${URL_}/sitemap.xml\n`);
  });
});

describe("assets and headers", () => {
  it("keeps every image small", () => {
    const pub = join(root, "public");
    const images = readdirSync(pub).filter((name) => /\.(png|jpe?g|ico|svg|webp)$/.test(name));
    expect(images.length).toBeGreaterThanOrEqual(7);
    for (const name of images) expect(statSync(join(pub, name)).size, name).toBeLessThan(100 * 1024);
  });

  it("ships the icons the manifest names", () => {
    const manifest = JSON.parse(readFileSync(join(root, "public/site.webmanifest"), "utf8"));
    for (const icon of manifest.icons) expect(existsSync(join(root, "public", icon.src)), icon.src).toBe(true);
  });

  it("forces HTTPS and serves clean URLs", () => {
    const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
    const headers: { key: string; value: string }[] = vercel.headers[0].headers;
    expect(headers.find((header) => header.key === "Strict-Transport-Security")?.value).toMatch(/max-age=\d{8}/);
    expect(headers.find((header) => header.key === "Content-Security-Policy")?.value).toContain("upgrade-insecure-requests");
    expect(vercel.cleanUrls).toBe(true);
  });
});
