/**
 * Convert profiles saved by the Streamlit version (JSON) into Word files the
 * web version can open: `npm run profile-to-docx -- <profile.json>... [--out <dir>]`.
 *
 * It runs only on this computer. Each .docx is written next to its JSON file
 * (or into --out) and carries the same data the web version embeds. Title and
 * summary are not exported by either version, so they are not carried over.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { buildDocx } from "../src/export/docx";
import { fromDict } from "../src/model/profile";

const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const outDir = outIndex >= 0 ? args[outIndex + 1] : "";
const inputs = args.filter((_, index) => index !== outIndex && index !== outIndex + 1);

if (!inputs.length) {
  console.error("Usage: npm run profile-to-docx -- <profile.json>... [--out <dir>]");
  process.exit(1);
}

for (const input of inputs) {
  const profile = fromDict(JSON.parse(readFileSync(input, "utf8")));
  const output = join(outDir || dirname(input), `${basename(input, ".json")}.docx`);
  writeFileSync(output, await buildDocx(profile));
  console.log(`${input} -> ${output}`);
}
