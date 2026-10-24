/** PDF in the browser. The font is inlined in this chunk: no request at all. */

import pdfMake from "pdfmake/build/pdfmake";
import bold from "./fonts/CVDocSans-Bold.ttf?inline";
import regular from "./fonts/CVDocSans-Regular.ttf?inline";
import type { Profile } from "../model/profile";
import { pdfDefinition } from "./pdf";

const base64 = (dataUrl: string) => dataUrl.slice(dataUrl.indexOf(",") + 1);

pdfMake.addVirtualFileSystem({
  "CVDocSans-Regular.ttf": base64(regular),
  "CVDocSans-Bold.ttf": base64(bold),
});
pdfMake.addFonts({
  CVDocSans: {
    normal: "CVDocSans-Regular.ttf",
    bold: "CVDocSans-Bold.ttf",
    italics: "CVDocSans-Regular.ttf",
    bolditalics: "CVDocSans-Bold.ttf",
  },
});
// Nothing in a CV is fetched: refuse any URL a definition might name.
pdfMake.setUrlAccessPolicy(() => false);

export async function buildPdf(profile: Profile): Promise<Uint8Array> {
  const buffer = await pdfMake.createPdf(pdfDefinition(profile)).getBuffer();
  return new Uint8Array(buffer);
}
