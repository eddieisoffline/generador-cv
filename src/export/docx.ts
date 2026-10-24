/**
 * The Word export, a port of streamlit-app/generators/docx_generator.py:
 * Calibri 11 pt on US Letter, a ruled header, centred section headings and
 * entry lines with the location or dates pushed to the right margin.
 */

import {
  AlignmentType, BorderStyle, Document, ExternalHyperlink, HeadingLevel, LevelFormat, Packer, Paragraph,
  Tab, TabStopType, TextRun, type ParagraphChild,
} from "docx";
import { buildDocument, type CVDocument, type DocLine } from "../document/layout";
import { exportableProfile, type Profile } from "../model/profile";
import { embedProfile } from "./embed";

// Measurements in twips, taken from the template.
const PAGE_WIDTH = 12240;
const PAGE_HEIGHT = 15840;
const MARGIN_TOP = 720;
const MARGIN_SIDE = 605;
const MARGIN_BOTTOM = 280;
const TEXT_WIDTH = PAGE_WIDTH - 2 * MARGIN_SIDE;
const ENTRY_INDENT = 119;
const BULLET_INDENT = 839;
const BULLET_HANGING = 360;
const ENTRY_GAP = 220; // one blank 11 pt line between entries
const FONT = "Calibri";
const SEPARATOR = " • ";
const BULLETS = "cv-bullets";

const run = (text: string, bold = false) => new TextRun({ text, bold: bold || undefined });
const link = (text: string, href: string) => new ExternalHyperlink({ link: href, children: [run(text)] });

function paragraphs(line: DocLine, spaceBefore: number): Paragraph[] {
  const spacing = spaceBefore ? { before: spaceBefore } : undefined;
  switch (line.kind) {
    case "line": {
      const children: ParagraphChild[] = [run(line.left, line.bold && Boolean(line.left))];
      if (line.right) children.push(new TextRun({ children: [new Tab(), line.right] }));
      return [
        new Paragraph({
          children,
          indent: { left: ENTRY_INDENT },
          tabStops: line.right ? [{ type: TabStopType.RIGHT, position: TEXT_WIDTH }] : undefined,
          spacing,
        }),
      ];
    }
    case "text":
      return [
        new Paragraph({
          children: [...(line.label ? [run(`${line.label}: `, true)] : []), run(line.text)],
          indent: { left: ENTRY_INDENT },
          spacing,
        }),
      ];
    case "link":
      return [new Paragraph({ children: [link(line.text, line.href)], indent: { left: ENTRY_INDENT }, spacing })];
    case "bullets":
      return line.items.map(
        (item, index) =>
          new Paragraph({
            children: [run(item)],
            numbering: { reference: BULLETS, level: 0 },
            indent: { left: BULLET_INDENT, hanging: BULLET_HANGING },
            spacing: index === 0 ? spacing : undefined,
          }),
      );
  }
}

function header(document: CVDocument): Paragraph[] {
  const name = new Paragraph({
    children: [run(document.name, true)],
    alignment: AlignmentType.CENTER,
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, space: 1, color: "000000" } },
  });
  if (!document.contact.length) return [name];
  const children: ParagraphChild[] = [];
  document.contact.forEach((item, index) => {
    if (index) children.push(run(SEPARATOR));
    children.push(item.href ? link(item.text, item.href) : run(item.text));
  });
  return [name, new Paragraph({ children, alignment: AlignmentType.CENTER, spacing: { before: 100 } })];
}

export function docxDocument(profile: Profile): Document {
  const cv = buildDocument(profile);
  const body: Paragraph[] = header(cv);
  for (const section of cv.sections) {
    body.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }));
    section.entries.forEach((entry, entryIndex) => {
      entry.forEach((line, lineIndex) => {
        body.push(...paragraphs(line, entryIndex > 0 && lineIndex === 0 ? ENTRY_GAP : 0));
      });
    });
  }
  const name = profile.name.trim();
  return new Document({
    creator: name || "CV",
    lastModifiedBy: name || "CV",
    title: name || "CV",
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: "000000" },
          paragraph: { spacing: { before: 0, after: 0, line: 240 } },
        },
        heading1: {
          run: { font: FONT, size: 22, bold: true, italics: false, color: "000000" },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: ENTRY_GAP, after: 0, line: 240 }, keepNext: true },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: BULLETS,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: BULLET_INDENT, hanging: BULLET_HANGING } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_SIDE, right: MARGIN_SIDE },
          },
        },
        children: body,
      },
    ],
  });
}

/** The .docx bytes, with the CV data embedded for continuing later. */
export async function buildDocx(profile: Profile): Promise<Uint8Array> {
  const bytes = await Packer.toArrayBuffer(docxDocument(profile));
  return embedProfile(bytes, exportableProfile(profile));
}
