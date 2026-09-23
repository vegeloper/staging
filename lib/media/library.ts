import { createHash, randomUUID } from "node:crypto";

import { and, asc, count, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { mediaAssets, users } from "@/db/schema";
import type { AuthUser } from "@/lib/auth/session";
import { canManageSite } from "@/lib/auth/rbac";
import { HttpError } from "@/lib/http/errors";
import { getEnv } from "@/lib/env";
import type { SiteTheme } from "@/lib/site/defaults";

import { probeDurationMs, removeMediaKeys, writeMediaFile, writeThumbnail } from "./files";
import { inspectMedia, MediaReject } from "./inspect";
import { libraryMediaId, mediaThumbPath } from "./paths";
import { scanBuffer } from "./scan";
import type { MediaKind, MediaListItem, MediaRecord } from "./types";

export class MediaFailure extends Error {
  constructor(
    public code: "rejected" | "infected" | "unavailable",
    message: string,
  ) {
    super(message);
    this.name = "MediaFailure";
  }
}

export type MediaListQuery = {
  q?: string;
  kind?: MediaKind | "";
  sort?: "newest" | "oldest" | "name" | "size" | "type";
  from?: string;
  to?: string;
  page?: number;
};

const PAGE_SIZE = 24;

function isUniqueViolation(error: unknown) {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if ("code" in current && (current as { code?: string }).code === "23505") return true;
    current = "cause" in current ? (current as { cause?: unknown }).cause : undefined;
  }
  return false;
}

function cleanText(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim().slice(0, max);
  if (/[<>]/.test(text)) {
    throw new MediaFailure("rejected", "متن نباید برچسب HTML داشته باشد.");
  }
  return text;
}

function safeOriginalName(filename: string) {
  const base = (filename.split(/[/\\]/).pop() ?? "file").replace(/[\u0000-\u001f]/g, "");
  const cleaned = base.replace(/[<>]/g, "").trim().slice(0, 180);
  return cleaned || "file";
}

function likePattern(value: string) {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function toRecord(
  row: typeof mediaAssets.$inferSelect,
  uploaderName: string | null,
): MediaRecord {
  return {
    id: row.id,
    kind: row.kind,
    originalName: row.originalName,
    description: row.description,
    altText: row.altText,
    mimeType: row.mimeType,
    extension: row.extension,
    byteSize: row.byteSize,
    width: row.width,
    height: row.height,
    durationMs: row.durationMs,
    sha256: row.sha256,
    thumbUrl: row.thumbnailKey ? mediaThumbPath(row.id) : null,
    scanEngine: row.scanEngine,
    scanResult: row.scanResult,
    uploaderName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ownerId: row.uploadedBy,
  };
}

export function publicMedia(record: MediaRecord): MediaListItem {
  return {
    id: record.id,
    kind: record.kind,
    originalName: record.originalName,
    description: record.description,
    altText: record.altText,
    mimeType: record.mimeType,
    extension: record.extension,
    byteSize: record.byteSize,
    width: record.width,
    height: record.height,
    durationMs: record.durationMs,
    sha256: record.sha256,
    thumbUrl: record.thumbUrl,
    scanEngine: record.scanEngine,
    scanResult: record.scanResult,
    uploaderName: record.uploaderName,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function loadRecord(id: string) {
  const [row] = await getDb()
    .select({ asset: mediaAssets, uploaderName: users.username })
    .from(mediaAssets)
    .leftJoin(users, eq(mediaAssets.uploadedBy, users.id))
    .where(eq(mediaAssets.id, id))
    .limit(1);
  if (!row) return null;
  return toRecord(row.asset, row.uploaderName);
}

export async function getMedia(id: string) {
  return loadRecord(id);
}

export async function getStoredObject(id: string, which: "file" | "thumb") {
  const [row] = await getDb()
    .select({
      storageKey: mediaAssets.storageKey,
      thumbnailKey: mediaAssets.thumbnailKey,
      mimeType: mediaAssets.mimeType,
      originalName: mediaAssets.originalName,
      kind: mediaAssets.kind,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  if (!row) return null;
  if (which === "thumb") {
    if (!row.thumbnailKey) return null;
    return {
      key: row.thumbnailKey,
      mimeType: "image/jpeg",
      name: `${row.originalName}.thumb.jpg`,
      kind: row.kind,
    };
  }
  return { key: row.storageKey, mimeType: row.mimeType, name: row.originalName, kind: row.kind };
}

export async function listMedia(query: MediaListQuery) {
  const page = Math.min(1_000, Math.max(1, query.page ?? 1));
  const filters = [];
  if (query.kind === "image" || query.kind === "video") {
    filters.push(eq(mediaAssets.kind, query.kind));
  }
  const q = query.q?.trim().slice(0, 80);
  if (q) {
    const pattern = likePattern(q);
    filters.push(
      or(
        sql`${mediaAssets.originalName} ILIKE ${pattern} ESCAPE '\\'`,
        sql`${mediaAssets.description} ILIKE ${pattern} ESCAPE '\\'`,
        sql`${mediaAssets.altText} ILIKE ${pattern} ESCAPE '\\'`,
      ),
    );
  }
  if (query.from && /^\d{4}-\d{2}-\d{2}$/.test(query.from)) {
    filters.push(gte(mediaAssets.createdAt, new Date(`${query.from}T00:00:00.000Z`)));
  }
  if (query.to && /^\d{4}-\d{2}-\d{2}$/.test(query.to)) {
    filters.push(lte(mediaAssets.createdAt, new Date(`${query.to}T23:59:59.999Z`)));
  }
  const where = filters.length ? and(...filters) : undefined;
  const sort = query.sort ?? "newest";
  const order =
    sort === "oldest"
      ? asc(mediaAssets.createdAt)
      : sort === "name"
        ? asc(mediaAssets.originalName)
        : sort === "size"
          ? desc(mediaAssets.byteSize)
          : sort === "type"
            ? asc(mediaAssets.extension)
            : desc(mediaAssets.createdAt);

  const db = getDb();
  const [rows, [totalRow]] = await Promise.all([
    db
      .select({ asset: mediaAssets, uploaderName: users.username })
      .from(mediaAssets)
      .leftJoin(users, eq(mediaAssets.uploadedBy, users.id))
      .where(where)
      .orderBy(order)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(mediaAssets).where(where),
  ]);

  return {
    items: rows.map((row) => publicMedia(toRecord(row.asset, row.uploaderName))),
    page,
    pageSize: PAGE_SIZE,
    total: Number(totalRow?.total ?? 0),
  };
}

export async function countMediaAssets() {
  const [row] = await getDb().select({ total: count() }).from(mediaAssets);
  return Number(row?.total ?? 0);
}

async function findByHash(hash: string) {
  const [row] = await getDb()
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(eq(mediaAssets.sha256, hash))
    .limit(1);
  if (!row) return null;
  return loadRecord(row.id);
}

export async function ingestMedia(input: {
  buffer: Buffer;
  filename: string;
  description: string;
  altText: string;
  userId: string;
}) {
  const env = getEnv();
  let inspected;
  try {
    inspected = inspectMedia(input.buffer, input.filename, {
      image: env.MAX_MEDIA_IMAGE_BYTES,
      video: env.MAX_MEDIA_VIDEO_BYTES,
    });
  } catch (error) {
    if (error instanceof MediaReject) throw new MediaFailure("rejected", error.message);
    throw error;
  }

  let scan;
  try {
    scan = await scanBuffer(input.buffer);
  } catch {
    throw new MediaFailure("unavailable", "پویشگر ویروس در دسترس نیست. فایل ذخیره نشد.");
  }
  if (!scan.clean) {
    throw new MediaFailure("infected", `فایل آلوده است و ذخیره نشد${scan.signature ? ` (${scan.signature})` : ""}.`);
  }

  const hash = createHash("sha256").update(input.buffer).digest("hex");
  const existing = await findByHash(hash);
  if (existing) return { asset: publicMedia(existing), duplicate: true };

  const description = cleanText(input.description, 500);
  const altText = cleanText(input.altText, 300);
  const id = randomUUID();
  let storageKey: string | null = null;
  let thumbnailKey: string | null = null;
  try {
    storageKey = await writeMediaFile(id, inspected.extension, input.buffer);
    thumbnailKey = await writeThumbnail(id, storageKey, inspected.kind);
    const durationMs = inspected.kind === "video" ? await probeDurationMs(storageKey) : null;
    await getDb().insert(mediaAssets).values({
      id,
      kind: inspected.kind,
      originalName: safeOriginalName(input.filename),
      description,
      altText,
      mimeType: inspected.mimeType,
      extension: inspected.extension,
      byteSize: input.buffer.length,
      width: inspected.width,
      height: inspected.height,
      durationMs,
      sha256: hash,
      storageKey,
      thumbnailKey,
      scanEngine: scan.engine,
      scanResult: "clean",
      uploadedBy: input.userId,
    });
    const created = await loadRecord(id);
    if (!created) throw new Error("media row missing after insert");
    return { asset: publicMedia(created), duplicate: false };
  } catch (error) {
    await removeMediaKeys([storageKey, thumbnailKey]);
    if (isUniqueViolation(error)) {
      const again = await findByHash(hash);
      if (again) return { asset: publicMedia(again), duplicate: true };
    }
    throw error;
  }
}

function assertOwner(user: AuthUser, ownerId: string | null) {
  if (canManageSite(user.role)) return;
  if (!ownerId || ownerId !== user.id) {
    throw new HttpError(403, "این رسانه متعلق به شما نیست.");
  }
}

export async function updateMediaMeta(
  user: AuthUser,
  id: string,
  input: { description: string; altText: string },
) {
  const existing = await loadRecord(id);
  if (!existing) throw new HttpError(404, "رسانه پیدا نشد.");
  assertOwner(user, existing.ownerId);
  await getDb()
    .update(mediaAssets)
    .set({
      description: cleanText(input.description, 500),
      altText: cleanText(input.altText, 300),
      updatedAt: new Date(),
    })
    .where(eq(mediaAssets.id, id));
  const updated = await loadRecord(id);
  if (!updated) throw new HttpError(404, "رسانه پیدا نشد.");
  return publicMedia(updated);
}

export async function deleteMedia(user: AuthUser, id: string) {
  const existing = await getDb()
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  const row = existing[0];
  if (!row) throw new HttpError(404, "رسانه پیدا نشد.");
  assertOwner(user, row.uploadedBy);
  await getDb().delete(mediaAssets).where(eq(mediaAssets.id, id));
  await removeMediaKeys([row.storageKey, row.thumbnailKey]);
}

export async function assertLibraryImage(src: string) {
  const id = libraryMediaId(src);
  if (!id) return;
  const [row] = await getDb()
    .select({ kind: mediaAssets.kind })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  if (!row || row.kind !== "image") {
    throw new HttpError(422, "تصویر انتخاب‌شده در کتابخانه رسانه پیدا نشد.");
  }
}

export async function assertThemeAssets(theme: SiteTheme) {
  const checks: Array<{ id: string; kind: MediaKind }> = [];
  for (const src of [
    theme.background.image,
    theme.media.logo,
    theme.media.logoFooter,
    theme.media.footerLogo,
    theme.media.heroImage,
    theme.media.campaignPoster,
  ]) {
    const id = libraryMediaId(src);
    if (id) checks.push({ id, kind: "image" });
  }
  const videoId = libraryMediaId(theme.media.campaignVideo);
  if (videoId) checks.push({ id: videoId, kind: "video" });
  if (!checks.length) return;

  const rows = await getDb()
    .select({ id: mediaAssets.id, kind: mediaAssets.kind })
    .from(mediaAssets)
    .where(
      inArray(
        mediaAssets.id,
        checks.map((check) => check.id),
      ),
    );
  const kinds = new Map(rows.map((row) => [row.id, row.kind]));
  for (const check of checks) {
    if (kinds.get(check.id) !== check.kind) {
      throw new HttpError(
        422,
        check.kind === "image"
          ? "یکی از تصاویر پوسته در کتابخانه معتبر نیست."
          : "ویدیوی پوسته در کتابخانه معتبر نیست.",
      );
    }
  }
}
