import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

// Production headers live in vercel.json. `vite preview` serves the same ones,
// so the Content-Security-Policy is exercised locally before deploying.
const vercel = JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url), "utf8")) as {
  headers: HeaderRule[];
};
const pageHeaders = Object.fromEntries(
  vercel.headers.find((rule) => rule.source === "/(.*)")!.headers.map(({ key, value }) => [key, value]),
);

export default defineConfig({
  plugins: [react()],
  build: {
    // The polyfill would fetch() modules, which `connect-src 'none'` forbids.
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 2000,
  },
  preview: { port: 4173, strictPort: true, headers: pageHeaders },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
