import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { getEnv } from "@/lib/env";
import {
  ALLOWED_RESUME_TYPES,
  canonicalizeMime,
  type AllowedResumeMime,
} from "@/lib/forms/resume";

export {
  ALLOWED_RESUME_TYPES,
  canonicalizeMime,
  resumeAttachmentKind,
  RESUME_ACCEPT,
  RESUME_TYPE_ERROR,
  type AllowedResumeMime,
  type ResumeAttachmentKind,
} from "@/lib/forms/resume";

const PDF_SIGNATURE = Buffer.from("%PDF", "ascii");
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const OLE_SIGNATURE = Buffer.from([
  0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
]);

export type StoredResume = {
  storageKey: string;
  originalName: string;
  mimeType: AllowedResumeMime;
  size: number;
};

function getResumeRoot() {
  return path.resolve(getEnv().UPLOAD_ROOT);
}

export async function ensureResumeRoot() {
  await mkdir(getResumeRoot(), { recursive: true });
}

function hasPdfSignature(buffer: Buffer) {
  return buffer.length >= 4 && buffer.subarray(0, 4).equals(PDF_SIGNATURE);
}

function hasDocxSignature(buffer: Buffer) {
  return buffer.length >= 4 && buffer.subarray(0, 4).equals(ZIP_SIGNATURE);
}

function hasDocSignature(buffer: Buffer) {
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(OLE_SIGNATURE);
}

function signatureMatches(buffer: Buffer, mimeType: AllowedResumeMime) {
  if (mimeType === "application/pdf") return hasPdfSignature(buffer);
  if (mimeType === "application/msword") return hasDocSignature(buffer);
  return hasDocxSignature(buffer);
}

export function isAllowedResumeMime(
  mimeType: string,
): mimeType is AllowedResumeMime {
  return canonicalizeMime(mimeType) !== null;
}

export function resolveResumeMime(input: {
  buffer: Buffer;
  mimeType?: string | null;
  originalName: string;
}): AllowedResumeMime {
  const extension = extensionFromName(input.originalName);
  const declared = canonicalizeMime(input.mimeType);

  if (declared && ALLOWED_RESUME_TYPES[declared] === extension) {
    if (!signatureMatches(input.buffer, declared)) {
      throw new Error("Resume contents do not match the declared file type.");
    }
    return declared;
  }

  if (hasPdfSignature(input.buffer) && extension === "pdf") {
    return "application/pdf";
  }
  if (hasDocSignature(input.buffer) && extension === "doc") {
    return "application/msword";
  }
  if (hasDocxSignature(input.buffer) && extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  throw new Error("Only PDF, DOC, and DOCX resumes are accepted.");
}

export function assertSafeResume(input: {
  buffer: Buffer;
  mimeType?: string | null;
  originalName: string;
  size?: number;
}) {
  const size = input.size ?? input.buffer.byteLength;
  const maxBytes = getEnv().MAX_RESUME_BYTES;

  if (size <= 0 || input.buffer.byteLength <= 0) {
    throw new Error("Resume file is empty.");
  }

  if (size > maxBytes || input.buffer.byteLength > maxBytes) {
    throw new Error(`Resume exceeds the ${maxBytes} byte limit.`);
  }

  if (input.buffer.byteLength !== size && input.size) {
    throw new Error("Resume size does not match the uploaded bytes.");
  }

  return resolveResumeMime(input);
}

export async function saveResume(input: {
  buffer: Buffer;
  mimeType?: string | null;
  originalName: string;
}): Promise<StoredResume> {
  const mimeType = assertSafeResume(input);
  await ensureResumeRoot();

  const year = String(new Date().getUTCFullYear());
  const extension = ALLOWED_RESUME_TYPES[mimeType];
  const storageKey = path.posix.join(year, `${randomUUID()}.${extension}`);
  const destination = resolveStoragePath(storageKey);

  try {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, input.buffer, { flag: "wx" });
  } catch (error) {
    const code =
      error instanceof Error && "code" in error
        ? String((error as NodeJS.ErrnoException).code)
        : "UNKNOWN";
    throw new Error(
      `Cannot write resume to ${getResumeRoot()} (${code}). The upload directory must be writable by uid 1000.`,
    );
  }

  return {
    storageKey,
    originalName: sanitizeOriginalName(input.originalName, extension),
    mimeType,
    size: input.buffer.byteLength,
  };
}

export async function readResume(storageKey: string) {
  return readFile(resolveStoragePath(storageKey));
}

export async function deleteResume(storageKey: string) {
  await unlink(resolveStoragePath(storageKey));
}

export function contentDispositionAttachment(originalName: string) {
  const fallback =
    originalName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\\r\n]/g, "_") ||
    "resume";
  const encoded = encodeURIComponent(originalName).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

function resolveStoragePath(storageKey: string) {
  if (
    !storageKey ||
    storageKey.includes("\0") ||
    path.posix.normalize(storageKey) !== storageKey ||
    storageKey.startsWith("/") ||
    storageKey.startsWith("../") ||
    storageKey.split("/").some((segment) => segment === "..")
  ) {
    throw new Error("Invalid resume storage key.");
  }

  const root = getResumeRoot();
  const resolved = path.resolve(root, ...storageKey.split("/"));
  const relative = path.relative(root, resolved);

  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    relative.length === 0
  ) {
    throw new Error("Invalid resume storage key.");
  }

  const extension = path.extname(resolved).slice(1).toLowerCase();
  if (!["pdf", "doc", "docx"].includes(extension)) {
    throw new Error("Invalid resume storage key.");
  }

  return resolved;
}

function extensionFromName(originalName: string) {
  const extension = path.posix.extname(originalName.replaceAll("\\", "/"));
  return extension.replace(".", "").toLowerCase();
}

function sanitizeOriginalName(originalName: string, expectedExtension: string) {
  const base = path.posix.basename(originalName.replaceAll("\\", "/")).trim();
  const cleaned = base
    .replace(/[\u0000-\u001F\u007F"<>|:*?/\\]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 120);
  const extension = extensionFromName(cleaned);
  if (extension !== expectedExtension) {
    return `resume.${expectedExtension}`;
  }
  return cleaned || `resume.${expectedExtension}`;
}
