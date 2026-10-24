/** Reading the uploaded Word file and saving downloads, all in the browser. */

import type { Profile } from "../model/profile";
import { extractProfile, ImportError } from "./embed";

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const PDF_MIME = "application/pdf";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export type FileErrorCode = "not_docx" | "too_big" | ImportError["code"];

export class FileError extends Error {
  constructor(readonly code: FileErrorCode, detail = "") {
    super(detail || code);
    this.name = "FileError";
  }
}

export async function readCvFile(file: File): Promise<Profile> {
  if (!/\.docx$/i.test(file.name)) throw new FileError("not_docx");
  if (file.size > MAX_FILE_SIZE) throw new FileError("too_big");
  try {
    return await extractProfile(await file.arrayBuffer());
  } catch (error) {
    if (error instanceof ImportError) throw new FileError(error.code, error.message);
    throw error;
  }
}

/** Hand the bytes to the browser as a download; nothing is uploaded. */
export function saveFile(bytes: Uint8Array, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
