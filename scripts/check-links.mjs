// Check every link in the built site: `npm run build && npm run check:links`.
// Internal links and #anchors must point at files in dist/ (clean URLs map to
// .html, as on Vercel). With --external, outside links are requested too.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const checkExternal = process.argv.includes("--external");

if (!existsSync(join(dist, "index.html"))) {
  console.error("dist/ is missing: run `npm run build` first.");
  process.exit(1);
}

const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });

// The site's own origin, as written into canonical URLs and robots.txt.
const robots = readFileSync(join(dist, "robots.txt"), "utf8");
const origin = new URL(/Sitemap:\s*(\S+)/.exec(robots)[1]).origin;

/** The dist file a site path is served from, or null. */
function resolve(pathname) {
  const clean = decodeURIComponent(pathname).replace(/\/+$/, "") || "/";
  const candidates = clean === "/" ? ["index.html"] : [clean.slice(1), `${clean.slice(1)}.html`, `${clean.slice(1)}/index.html`];
  return candidates.map((candidate) => join(dist, candidate)).find((path) => existsSync(path) && statSync(path).isFile()) ?? null;
}

const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) ids.set(file, new Set([...readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
};

const broken = [];
const external = new Map();
const pages = files(dist).filter((path) => path.endsWith(".html") || path.endsWith(".xml") || path.endsWith(".webmanifest"));

for (const file of pages) {
  const text = readFileSync(file, "utf8");
  const page = "/" + relative(dist, file).split(sep).join("/");
  const refs = [
    ...[...text.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]),
    // og:url and og:image; other `content` values (colours, text) are not links.
    ...[...text.matchAll(/\scontent="(https?:[^"]+)"/g)].map((m) => m[1]),
    ...[...text.matchAll(/<(?:loc)>([^<]+)<\/loc>/g)].map((m) => m[1]),
    ...[...text.matchAll(/"src":\s*"([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const ref of refs) {
    if (/^(mailto:|data:|blob:|javascript:)/.test(ref)) continue;
    const url = new URL(ref, `${origin}${page}`);
    if (url.origin !== origin) {
      if (!external.has(url.href)) external.set(url.href, page);
      continue;
    }
    const target = url.pathname === page ? file : resolve(url.pathname);
    if (!target) {
      broken.push(`${page}: ${ref} (no such page or file)`);
      continue;
    }
    if (url.hash && target.endsWith(".html") && !idsOf(target).has(decodeURIComponent(url.hash.slice(1)))) {
      broken.push(`${page}: ${ref} (no element with that id)`);
    }
  }
}

if (checkExternal) {
  for (const [href, page] of external) {
    try {
      let response = await fetch(href, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(15000) });
      if (response.status >= 400) response = await fetch(href, { redirect: "follow", signal: AbortSignal.timeout(15000) });
      console.log(`${response.status} ${href}`);
      if (response.status >= 400) broken.push(`${page}: ${href} (HTTP ${response.status})`);
    } catch (error) {
      broken.push(`${page}: ${href} (${error.cause?.code ?? error.message})`);
    }
  }
}

console.log(`${pages.length} files checked, ${external.size} external links${checkExternal ? " requested" : " (use --external to request them)"}.`);
if (broken.length) {
  console.error(`Broken links:\n  ${broken.join("\n  ")}`);
  process.exit(1);
}
console.log("No broken links.");
