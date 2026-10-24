/** Plain-text formatting shared by the preview and both exports. */

export const SEPARATOR = " • ";

export function dateRange(start: string, end: string): string {
  return [start, end].map((value) => value.trim()).filter(Boolean).join(" – ");
}

/** Shorten a URL for display; the link target keeps the full address. */
export function displayUrl(url: string): string {
  let text = url.trim();
  for (const prefix of ["https://", "http://"]) {
    if (text.toLowerCase().startsWith(prefix)) text = text.slice(prefix.length);
  }
  if (text.toLowerCase().startsWith("www.")) text = text.slice(4);
  return text.replace(/\/+$/, "");
}

/** A link target for a typed address: bare domains get https://. */
export function linkTarget(url: string): string {
  const value = url.trim();
  if (!value) return "";
  if (/^(https?:|mailto:)/i.test(value)) return value;
  return `https://${value}`;
}

export function joinNonEmpty(values: string[], separator = SEPARATOR): string {
  return values.map((value) => value.trim()).filter(Boolean).join(separator);
}

/** A download name from the person's name: "Ana Rodríguez" → "cv-ana-rodriguez". */
export function fileStem(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug ? `cv-${slug}` : "cv";
}
