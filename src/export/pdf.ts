/**
 * The PDF layout for pdfmake, a port of streamlit-app/generators/
 * latex_generator.py: Carlito 11 pt (as "CV Doc Sans", see fonts/README.md)
 * on US Letter, margins of 0.5 in (top), 0.2 in (bottom) and 0.42 in (sides),
 * 11 pt between sections and entries, and bullets with the label at 0.33 in
 * and the text at 0.58 in.
 */

import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { buildDocument, type CVDocument, type DocLine } from "../document/layout";
import type { Profile } from "../model/profile";

const INCH = 72;
const PAGE_WIDTH = 8.5 * INCH;
const MARGIN_SIDE = 0.42 * INCH;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_SIDE;
const GAP = 11;
const BULLET_LABEL_INDENT = 0.33 * INCH;
const BULLET_LABEL_WIDTH = 0.25 * INCH;
/** The font's line box is 13.43 pt at 11 pt; LaTeX's baselineskip is 13.6 pt. */
const LINE_HEIGHT = 13.6 / 13.43;

function line(item: DocLine): Content {
  switch (item.kind) {
    case "line":
      if (!item.right) return { text: item.left, bold: item.bold };
      return {
        columns: [
          { width: "*", text: item.left, bold: item.bold && Boolean(item.left) },
          { width: "auto", text: item.right, alignment: "right" },
        ],
        columnGap: GAP,
      };
    case "text":
      return { text: [...(item.label ? [{ text: `${item.label}: `, bold: true }] : []), item.text] };
    case "link":
      return { text: item.text, link: item.href };
    case "bullets":
      return {
        stack: item.items.map((text) => ({
          columns: [
            { width: BULLET_LABEL_INDENT, text: "" },
            { width: BULLET_LABEL_WIDTH, text: "•" },
            { width: "*", text },
          ],
          columnGap: 0,
        })),
      };
  }
}

function header(cv: CVDocument): Content[] {
  const content: Content[] = [
    { text: cv.name, bold: true, alignment: "center" },
    {
      canvas: [{ type: "line", x1: 0, y1: 0.5, x2: CONTENT_WIDTH, y2: 0.5, lineWidth: 1 }],
      // LaTeX: \vspace{2pt}\hrule\vspace{5pt}; pdfmake's line box already adds ~3 pt above the text.
      margin: [0, 2, 0, 2],
    },
  ];
  if (cv.contact.length) {
    content.push({
      alignment: "center",
      text: cv.contact.flatMap((item, index) => [
        ...(index ? [" • "] : []),
        item.href ? { text: item.text, link: item.href } : item.text,
      ]),
    });
  }
  return content;
}

export function pdfDefinition(profile: Profile): TDocumentDefinitions {
  const cv = buildDocument(profile);
  const content: Content[] = header(cv);
  for (const section of cv.sections) {
    const entries: Content[] = section.entries.map((entry, index) => ({
      stack: entry.map(line),
      margin: [0, index ? GAP : 0, 0, 0],
    }));
    const [first, ...rest] = entries;
    // Keep each heading with its first entry, as LaTeX's \nopagebreak does.
    content.push(
      { stack: [{ text: section.title, bold: true, alignment: "center", margin: [0, GAP, 0, 0] }, first], unbreakable: true },
      ...rest,
    );
  }
  const name = profile.name.trim() || "CV";
  return {
    pageSize: "LETTER",
    pageMargins: [MARGIN_SIDE, 0.5 * INCH, MARGIN_SIDE, 0.2 * INCH],
    info: { title: name, author: name, creator: "Generador de CV", producer: "Generador de CV" },
    defaultStyle: { font: "CVDocSans", fontSize: 11, lineHeight: LINE_HEIGHT },
    content,
  };
}
