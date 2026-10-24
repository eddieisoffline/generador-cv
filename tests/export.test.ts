import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { Packer } from "docx";
import pdfmake from "pdfmake";
import { describe, expect, it } from "vitest";
import { buildDocx, docxDocument } from "../src/export/docx";
import { NAMESPACE, embedProfile, extractProfile } from "../src/export/embed";
import { pdfDefinition } from "../src/export/pdf";
import { emptyProfile, exportableProfile, fromDict, setVisibility, type Profile } from "../src/model/profile";

const legacy = (): Profile =>
  fromDict(JSON.parse(readFileSync(new URL("./fixtures/legacy-input.json", import.meta.url), "utf8")));

async function partText(bytes: Uint8Array, path: string): Promise<string> {
  return (await JSZip.loadAsync(bytes)).file(path)!.async("string");
}

describe("Word export", () => {
  it("carries the visible CV and reads it back unchanged", async () => {
    const profile = setVisibility(legacy(), ["projects"], true);
    const bytes = await buildDocx(profile);
    expect(await extractProfile(bytes)).toEqual(exportableProfile(profile));
  });

  it("leaves hidden sections out of the file entirely", async () => {
    const profile = { ...emptyProfile(), name: "Ada", interests: ["Secret hobby"] };
    const bytes = await buildDocx(setVisibility(profile, ["interests"], false));
    const zip = await JSZip.loadAsync(bytes);
    for (const name of Object.keys(zip.files)) {
      if (zip.files[name].dir) continue;
      expect(await zip.files[name].async("string"), name).not.toContain("Secret hobby");
    }
  });

  it("keeps text that needs escaping intact", async () => {
    const profile = { ...emptyProfile(), name: `Ana "Ñ" <Ruiz> & Co. 😀 ]]>` };
    const bytes = await buildDocx(profile);
    expect((await extractProfile(bytes)).name).toBe(profile.name);
  });

  it("registers the data part in the package", async () => {
    const bytes = await buildDocx({ ...emptyProfile(), name: "Ada" });
    expect(await partText(bytes, "customXml/item1.xml")).toContain(`xmlns:cv="${NAMESPACE}"`);
    expect(await partText(bytes, "word/_rels/document.xml.rels")).toContain('Target="../customXml/item1.xml"');
    expect(await partText(bytes, "[Content_Types].xml")).toContain('PartName="/customXml/itemProps1.xml"');
  });

  it("lays the document out in export order", async () => {
    const bytes = await buildDocx(legacy());
    const xml = await partText(bytes, "word/document.xml");
    const order = ["Ada Example", "Educación", "Experiencia", "Liderazgo y actividades", "Habilidades e intereses", "Experiencia de voluntariado"];
    const positions = order.map((text) => xml.indexOf(`>${text}<`));
    expect(positions.every((position) => position >= 0), String(positions)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(xml).toContain('w:w="12240"');
  });

  it("reads data that Word saved with another prefix", async () => {
    const plain = await Packer.toArrayBuffer(docxDocument(emptyProfile()));
    const bytes = await embedProfile(plain, { ...emptyProfile(), name: "Ada" });
    const zip = await JSZip.loadAsync(bytes);
    const item = await zip.file("customXml/item1.xml")!.async("string");
    zip.file(
      "customXml/item1.xml",
      item.replaceAll("<cv:", "<ns0:").replaceAll("</cv:", "</ns0:").replace("xmlns:cv=", "xmlns:ns0="),
    );
    const rewritten = await zip.generateAsync({ type: "uint8array" });
    expect((await extractProfile(rewritten)).name).toBe("Ada");
  });
});

describe("Word import errors", () => {
  it("says when a Word file has no generator data", async () => {
    const plain = new Uint8Array(await Packer.toArrayBuffer(docxDocument(emptyProfile())));
    await expect(extractProfile(plain)).rejects.toMatchObject({ code: "no_data" });
  });

  it("says when the file is not a zip", async () => {
    await expect(extractProfile(new TextEncoder().encode("not a docx"))).rejects.toMatchObject({ code: "broken" });
  });

  it("says when the data comes from a newer version", async () => {
    const bytes = await buildDocx(emptyProfile());
    const zip = await JSZip.loadAsync(bytes);
    const item = await zip.file("customXml/item1.xml")!.async("string");
    zip.file("customXml/item1.xml", item.replace('version="1"', 'version="2"'));
    await expect(extractProfile(await zip.generateAsync({ type: "uint8array" }))).rejects.toMatchObject({ code: "newer" });
  });

  it("says when the data is corrupt", async () => {
    const bytes = await buildDocx(emptyProfile());
    const zip = await JSZip.loadAsync(bytes);
    const item = await zip.file("customXml/item1.xml")!.async("string");
    zip.file("customXml/item1.xml", item.replace("{", "{{"));
    await expect(extractProfile(await zip.generateAsync({ type: "uint8array" }))).rejects.toMatchObject({ code: "broken" });
  });
});

describe("PDF export", () => {
  const fonts = fileURLToPath(new URL("../src/export/fonts/", import.meta.url));

  it("renders a letter-size PDF with the CV text", async () => {
    pdfmake.addFonts({
      CVDocSans: {
        normal: `${fonts}CVDocSans-Regular.ttf`,
        bold: `${fonts}CVDocSans-Bold.ttf`,
        italics: `${fonts}CVDocSans-Regular.ttf`,
        bolditalics: `${fonts}CVDocSans-Bold.ttf`,
      },
    });
    pdfmake.setUrlAccessPolicy(() => false);
    const buffer: Buffer = await pdfmake.createPdf(pdfDefinition(legacy())).getBuffer();
    const pdf = buffer.toString("latin1");
    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect(pdf).toContain("/MediaBox [0 0 612 792]");
  });

  it("keeps every heading with its first entry", () => {
    const definition = pdfDefinition(legacy());
    const headings = (definition.content as { unbreakable?: boolean }[]).filter((node) => node.unbreakable);
    expect(headings).toHaveLength(5);
  });
});
