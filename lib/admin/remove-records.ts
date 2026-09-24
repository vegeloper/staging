import { inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { contentPosts, jobApplications, jobPositions, submissions } from "@/db/schema";
import type { AuthUser } from "@/lib/auth/session";
import { canManageSite } from "@/lib/auth/rbac";
import { HttpError } from "@/lib/http/errors";
import { parseUuid } from "@/lib/http/body";
import { deleteMediaIds } from "@/lib/media/library";
import { deleteResume } from "@/lib/storage/resumes";

const MAX_IDS = 50;

export const removableKinds = ["media", "content", "position", "submission"] as const;
export type RemovableKind = (typeof removableKinds)[number];

export function isRemovableKind(value: unknown): value is RemovableKind {
  return typeof value === "string" && (removableKinds as readonly string[]).includes(value);
}

export async function removeRecords(user: AuthUser, kind: RemovableKind, rawIds: unknown) {
  if (!canManageSite(user.role)) {
    throw new HttpError(403, "فقط مدیر وب‌سایت می‌تواند حذف کند.");
  }
  if (!Array.isArray(rawIds) || rawIds.length === 0 || rawIds.length > MAX_IDS) {
    throw new HttpError(422, "فهرست حذف نامعتبر است.");
  }
  const ids = [
    ...new Set(
      rawIds
        .filter((id): id is string => typeof id === "string")
        .map((id) => parseUuid(id))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (!ids.length) throw new HttpError(422, "فهرست حذف نامعتبر است.");

  if (kind === "media") return deleteMediaIds(ids);
  if (kind === "content") return removeContent(ids);
  if (kind === "position") return removePositions(ids);
  return removeSubmissions(ids);
}

async function removeContent(ids: string[]) {
  const rows = await getDb()
    .delete(contentPosts)
    .where(inArray(contentPosts.id, ids))
    .returning({ id: contentPosts.id });
  return rows.length;
}

async function removePositions(ids: string[]) {
  const rows = await getDb()
    .delete(jobPositions)
    .where(inArray(jobPositions.id, ids))
    .returning({ id: jobPositions.id });
  return rows.length;
}

async function removeSubmissions(ids: string[]) {
  const resumes = await getDb()
    .select({ key: jobApplications.resumeStorageKey })
    .from(jobApplications)
    .where(inArray(jobApplications.submissionId, ids));
  for (const resume of resumes) {
    try {
      await deleteResume(resume.key);
    } catch {
      // The database row can outlive the file after a volume change.
    }
  }
  const rows = await getDb()
    .delete(submissions)
    .where(inArray(submissions.id, ids))
    .returning({ id: submissions.id });
  return rows.length;
}
