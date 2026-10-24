import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../src", import.meta.url));

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

// The promise to users is that nothing is stored or sent. Keep the code from
// ever reaching for storage or the network; vercel.json's CSP backs this up.
const FORBIDDEN = [
  /\blocalStorage\b/, /\bsessionStorage\b/, /\bindexedDB\b/, /document\.cookie/, /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/, /\bsendBeacon\b/, /\bWebSocket\b/, /\bEventSource\b/,
];

describe("privacy", () => {
  it.each(sources(SRC).map((path) => [path.slice(SRC.length + 1), path]))("%s uses no storage or network", (_, path) => {
    const code = readFileSync(path, "utf8");
    for (const pattern of FORBIDDEN) expect(code, String(pattern)).not.toMatch(pattern);
  });

  it("ships a CSP that blocks every connection", () => {
    const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
    const csp: string = vercel.headers[0].headers.find((header: { key: string }) => header.key === "Content-Security-Policy").value;
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("form-action 'none'");
    expect(csp).not.toContain("unsafe-eval");
  });
});
