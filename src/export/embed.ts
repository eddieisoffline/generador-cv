/**
 * The CV data inside the Word file. It is stored as a Custom XML part, a
 * standard piece of a .docx that Word keeps when the document is edited and
 * saved, so the same file can be uploaded later to continue editing.
 *
 * Only `exportableProfile` goes in: what the CV shows, nothing hidden.
 */

import JSZip from "jszip";
import { fromDict, type Profile } from "../model/profile";

export const NAMESPACE = "urn:generador-cv:perfil";
export const VERSION = 1;
const MAX_JSON_LENGTH = 1_000_000;

const CUSTOM_XML_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml";
const CUSTOM_XML_PROPS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps";
const PROPS_TYPE = "application/vnd.openxmlformats-officedocument.customXmlProperties+xml";

export type ImportErrorCode = "no_data" | "newer" | "broken";

export class ImportError extends Error {
  constructor(readonly code: ImportErrorCode, detail = "") {
    super(detail || code);
    this.name = "ImportError";
  }
}

const escapeXml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function unescapeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function guid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `{${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}}`;
}

/** Add the profile to a .docx package and return the new file. */
export async function embedProfile(docx: Uint8Array | ArrayBuffer, profile: Profile): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(docx);
  let number = 1;
  while (zip.file(`customXml/item${number}.xml`)) number += 1;
  const item = `customXml/item${number}.xml`;
  const props = `itemProps${number}.xml`;

  zip.file(
    item,
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
      `<cv:perfil xmlns:cv="${NAMESPACE}" version="${VERSION}">${escapeXml(JSON.stringify(profile))}</cv:perfil>`,
  );
  zip.file(
    `customXml/${props}`,
    `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n` +
      `<ds:datastoreItem ds:itemID="${guid()}" xmlns:ds="http://schemas.openxmlformats.org/officeDocument/2006/customXml">` +
      `<ds:schemaRefs><ds:schemaRef ds:uri="${NAMESPACE}"/></ds:schemaRefs></ds:datastoreItem>`,
  );
  zip.file(
    `customXml/_rels/item${number}.xml.rels`,
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="${CUSTOM_XML_PROPS_REL}" Target="${props}"/></Relationships>`,
  );

  const relsPath = "word/_rels/document.xml.rels";
  const rels = await zip.file(relsPath)!.async("string");
  zip.file(
    relsPath,
    rels.replace(
      "</Relationships>",
      `<Relationship Id="rIdCvData${number}" Type="${CUSTOM_XML_REL}" Target="../${item}"/></Relationships>`,
    ),
  );

  const typesPath = "[Content_Types].xml";
  let types = await zip.file(typesPath)!.async("string");
  if (!/Extension="xml"/i.test(types)) {
    types = types.replace("</Types>", `<Default Extension="xml" ContentType="application/xml"/></Types>`);
  }
  types = types.replace("</Types>", `<Override PartName="/customXml/${props}" ContentType="${PROPS_TYPE}"/></Types>`);
  zip.file(typesPath, types);

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

/** Find the generator's data in a .docx and read it back as a profile. */
export async function extractProfile(docx: Uint8Array | ArrayBuffer): Promise<Profile> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(docx);
  } catch (error) {
    throw new ImportError("broken", error instanceof Error ? error.message : String(error));
  }
  const items = zip.file(/^customXml\/item\d+\.xml$/);
  for (const item of items) {
    const xml = await item.async("string");
    // Word may rewrite the part with another prefix, so match any prefix.
    const element = new RegExp(
      `<(?:([\\w.-]+):)?perfil\\b([^>]*\\bxmlns(?::[\\w.-]+)?="${NAMESPACE}"[^>]*)>([\\s\\S]*?)</(?:[\\w.-]+:)?perfil>`,
    ).exec(xml);
    if (!element) continue;
    const version = Number(/\bversion="(\d+)"/.exec(element[2])?.[1] ?? "0");
    if (version > VERSION) throw new ImportError("newer");
    const json = unescapeXml(element[3]);
    if (json.length > MAX_JSON_LENGTH) throw new ImportError("broken", "data too large");
    try {
      return fromDict(JSON.parse(json));
    } catch (error) {
      throw new ImportError("broken", error instanceof Error ? error.message : String(error));
    }
  }
  throw new ImportError("no_data");
}
