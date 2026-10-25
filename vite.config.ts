import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { pageInputs, sitePlugin } from "./vite/site-plugin";

interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

// Production headers live in vercel.json. `vite preview` serves the same ones,
// so the Content-Security-Policy is exercised locally before deploying; only
// the HTTPS-only parts are left out, since the preview runs on plain HTTP.
const vercel = JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url), "utf8")) as {
  headers: HeaderRule[];
};
const pageHeaders = Object.fromEntries(
  vercel.headers
    .find((rule) => rule.source === "/(.*)")!
    .headers.filter(({ key }) => key !== "Strict-Transport-Security")
    .map(({ key, value }) => [key, value.replace(/;\s*upgrade-insecure-requests/, "")]),
);

export default defineConfig({
  // Several real HTML pages (the app, the legal pages, the 404), not a SPA.
  appType: "mpa",
  plugins: [react(), sitePlugin()],
  build: {
    // The polyfill would fetch() modules, which `connect-src 'none'` forbids.
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 2000,
    rollupOptions: { input: pageInputs(new URL("./", import.meta.url)) },
  },
  preview: { port: 4173, strictPort: true, headers: pageHeaders },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
