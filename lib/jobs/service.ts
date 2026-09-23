import { and, asc, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { jobPositionEvents, jobPositions, jobSettings, users } from "@/db/schema";
import { canManagePositions } from "@/lib/auth/rbac";
import { HttpError } from "@/lib/http/errors";
import { parseUuid } from "@/lib/http/body";
import { sanitizeSearchQuery } from "@/lib/forms/shared";
import { actionLabel } from "@/lib/cms/workflow";

import { starterPositions, type PositionSeed } from "./catalog";
import { positionFields, positionToForm, type PositionFormInput } from "./input";
import { toCorporateCard, toJobDetails, type PresentablePosition } from "./present";
import {
  canEditPosition,
  canProposePosition,
  canViewPosition,
  positionStatuses,
  transitionPosition,
  type PositionAction,
  type PositionActor,
  type PositionStatus,
} from "./workflow";

const PAGE_SIZE = 20;
let catalogReady = false;

export type ManagedPositionSummary = {
  id: string;
  slug: string;
  title: string;
  employmentType: string;
  city: string;
  department: string;
  status: PositionStatus;
  authorName: string;
  updatedAt: Date;
  reviewNote: string | null;
  isProposal: boolean;
  supersedesTitle: string | null;
};

export type ManagedPosition = {
  id: string;
  slug: string;
  desiredSlug: string;
  title: string;
  employmentType: string;
  department: string;
  city: string;
  summary: string;
  highlights: string[];
  sections: PresentablePosition["sections"];
  meta: PresentablePosition["meta"];
  sortOrder: number;
  status: PositionStatus;
  authorId: string | null;
  authorName: string;
  reviewNote: string | null;
  supersedesId: string | null;
  updatedAt: Date;
  form: ReturnType<typeof positionToForm>;
};

export type PositionHistoryItem = {
  id: string;
  action: string;
  label: string;
  note: string | null;
  actorName: string | null;
  createdAt: string;
};

function actorFromUser(user: { id: string; role: PositionActor["role"] }): PositionActor {
  return { userId: user.id, role: user.role };
}

function isUniqueViolation(error: unknown) {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if ("code" in current && (current as { code?: string }).code === "23505") {
      return true;
    }
    current = "cause" in current ? (current as { cause?: unknown }).cause : undefined;
  }
  return false;
}

function assertPositions(actor: PositionActor) {
  if (!canManagePositions(actor.role)) {
    throw new HttpError(403, "به بخش موقعیت‌های شغلی دسترسی ندارید.");
  }
}

function presentSeed(seed: PositionSeed): PresentablePosition {
  return seed;
}

export async function ensureStarterPositions() {
  if (catalogReady) return;
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(814271)`);
    const [marker] = await tx
      .select({ id: jobSettings.id })
      .from(jobSettings)
      .where(eq(jobSettings.id, "starter-positions"))
      .limit(1);
    if (marker) return;

    const publishedAt = new Date();
    for (const item of starterPositions()) {
      await tx
        .insert(jobPositions)
        .values({
          slug: item.slug,
          desiredSlug: item.slug,
          title: item.title,
          employmentType: item.employmentType,
          department: item.department,
          city: item.city,
          summary: item.summary,
          highlights: item.highlights,
          sections: item.sections,
          meta: item.meta,
          sortOrder: item.sortOrder,
          status: "approved",
          publishedAt,
        })
        .onConflictDoNothing({ target: jobPositions.slug });
    }
    await tx.insert(jobSettings).values({ id: "starter-positions" });
  });
  catalogReady = true;
}

function livePosition(row: {
  status: PositionStatus;
  supersedesId: string | null;
  slug: string;
  desiredSlug: string;
  title: string;
  employmentType: string;
  department: string;
  city: string;
  summary: string;
  highlights: string[];
  sections: PresentablePosition["sections"];
  meta: PresentablePosition["meta"];
}): PresentablePosition {
  return {
    slug: row.supersedesId ? row.desiredSlug : row.slug,
    title: row.title,
    employmentType: row.employmentType,
    department: row.department,
    city: row.city,
    summary: row.summary,
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    sections: Array.isArray(row.sections) ? row.sections : [],
    meta: Array.isArray(row.meta) ? row.meta : [],
  };
}

export async function getPublicPositions() {
  if (!process.env.DATABASE_URL) {
    return starterPositions().map((item) => toCorporateCard(presentSeed(item)));
  }

  try {
    await ensureStarterPositions();
    const rows = await getDb()
      .select()
      .from(jobPositions)
      .where(and(eq(jobPositions.status, "approved"), isNull(jobPositions.supersedesId)))
      .orderBy(asc(jobPositions.sortOrder), desc(jobPositions.publishedAt));
    return rows.map((row) => toCorporateCard(livePosition(row)));
  } catch (error) {
    console.error("Published positions fell back to the static catalog.", error);
    return starterPositions().map((item) => toCorporateCard(presentSeed(item)));
  }
}

export async function getPublishedPosition(slug: string) {
  const fallback = starterPositions().find((item) => item.slug === slug);
  if (!process.env.DATABASE_URL) {
    return fallback ? toJobDetails(presentSeed(fallback)) : null;
  }

  try {
    await ensureStarterPositions();
    const [row] = await getDb()
      .select()
      .from(jobPositions)
      .where(
        and(
          eq(jobPositions.slug, slug),
          eq(jobPositions.status, "approved"),
          isNull(jobPositions.supersedesId),
        ),
      )
      .limit(1);
    if (!row) return null;
    return toJobDetails(livePosition(row));
  } catch (error) {
    console.error("Position detail fell back to the static catalog.", error);
    return fallback ? toJobDetails(presentSeed(fallback)) : null;
  }
}

function statusPatch(action: PositionAction, actor: PositionActor, note?: string) {
  const now = new Date();
  if (action === "submit") {
    return {
      status: "pending_review" as const,
      submittedAt: now,
      reviewNote: null,
      updatedAt: now,
    };
  }
  if (action === "withdraw" || action === "unpublish") {
    return {
      status: "draft" as const,
      reviewNote: null,
      updatedAt: now,
    };
  }
  if (action === "approve" || action === "publish") {
    return {
      status: "approved" as const,
      reviewerId: actor.userId,
      reviewedAt: now,
      publishedAt: now,
      reviewNote: null,
      updatedAt: now,
    };
  }
  return {
    status: "rejected" as const,
    reviewerId: actor.userId,
    reviewedAt: now,
    reviewNote: note?.trim() ?? null,
    updatedAt: now,
  };
}

async function loadPosition(id: string) {
  const positionId = parseUuid(id);
  if (!positionId) return null;
  const [row] = await getDb()
    .select()
    .from(jobPositions)
    .where(eq(jobPositions.id, positionId))
    .limit(1);
  return row ?? null;
}

async function uniqueProposalSlug(
  tx: Pick<ReturnType<typeof getDb>, "select">,
  baseSlug: string,
) {
  const root = `${baseSlug}-proposal`.slice(0, 80);
  let candidate = root;
  for (let attempt = 2; attempt < 50; attempt += 1) {
    const [existing] = await tx
      .select({ id: jobPositions.id })
      .from(jobPositions)
      .where(eq(jobPositions.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
    const suffix = `-${attempt}`;
    candidate = `${root.slice(0, 80 - suffix.length)}${suffix}`;
  }
  throw new HttpError(409, "ساخت پیشنهاد ویرایش ممکن نشد.");
}

function contentFromRow(row: typeof jobPositions.$inferSelect) {
  return {
    title: row.title,
    employmentType: row.employmentType,
    department: row.department,
    city: row.city,
    summary: row.summary,
    highlights: row.highlights,
    sections: row.sections,
    meta: row.meta,
    sortOrder: row.sortOrder,
    desiredSlug: row.desiredSlug,
    updatedAt: new Date(),
  };
}

export async function listManagedPositions(
  user: { id: string; role: PositionActor["role"] },
  filters: { status?: string; query?: string; page?: number },
) {
  const actor = actorFromUser(user);
  assertPositions(actor);
  await ensureStarterPositions();

  const status = positionStatuses.find((value) => value === filters.status);
  const query = filters.query ? sanitizeSearchQuery(filters.query) : "";
  const scope =
    actor.role === "operator"
      ? or(
          eq(jobPositions.authorId, actor.userId),
          and(eq(jobPositions.status, "approved"), isNull(jobPositions.supersedesId)),
        )
      : undefined;
  const filtersSql = [
    scope,
    status ? eq(jobPositions.status, status) : undefined,
    query
      ? or(
          ilike(jobPositions.title, `%${query}%`),
          ilike(jobPositions.slug, `%${query}%`),
          ilike(jobPositions.desiredSlug, `%${query}%`),
          ilike(jobPositions.city, `%${query}%`),
        )
      : undefined,
  ].filter((clause) => clause !== undefined);
  const where = filtersSql.length > 0 ? and(...filtersSql) : undefined;

  const db = getDb();
  const [totalRow] = await db.select({ total: count() }).from(jobPositions).where(where);
  const total = Number(totalRow?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(filters.page ?? 1, 1), totalPages);

  const rows = await db
    .select({
      id: jobPositions.id,
      slug: jobPositions.slug,
      desiredSlug: jobPositions.desiredSlug,
      title: jobPositions.title,
      employmentType: jobPositions.employmentType,
      city: jobPositions.city,
      department: jobPositions.department,
      status: jobPositions.status,
      authorName: users.username,
      updatedAt: jobPositions.updatedAt,
      reviewNote: jobPositions.reviewNote,
      supersedesId: jobPositions.supersedesId,
    })
    .from(jobPositions)
    .leftJoin(users, eq(jobPositions.authorId, users.id))
    .where(where)
    .orderBy(desc(jobPositions.updatedAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const parentIds = rows.flatMap((row) => (row.supersedesId ? [row.supersedesId] : []));
  const parents =
    parentIds.length === 0
      ? []
      : await db
          .select({ id: jobPositions.id, title: jobPositions.title })
          .from(jobPositions)
          .where(or(...parentIds.map((id) => eq(jobPositions.id, id))));
  const parentTitle = new Map(parents.map((parent) => [parent.id, parent.title]));

  const items: ManagedPositionSummary[] = rows.map((row) => ({
    id: row.id,
    slug: row.supersedesId ? row.desiredSlug : row.slug,
    title: row.title,
    employmentType: row.employmentType,
    city: row.city,
    department: row.department,
    status: row.status,
    authorName: row.authorName ?? "سایت",
    updatedAt: row.updatedAt,
    reviewNote: row.reviewNote,
    isProposal: Boolean(row.supersedesId),
    supersedesTitle: row.supersedesId ? parentTitle.get(row.supersedesId) ?? null : null,
  }));

  return { items, page, total, totalPages, pageSize: PAGE_SIZE };
}

function toManaged(
  row: typeof jobPositions.$inferSelect,
  authorName: string | null,
): ManagedPosition {
  const present = livePosition(row);
  return {
    id: row.id,
    slug: row.slug,
    desiredSlug: row.desiredSlug,
    title: row.title,
    employmentType: row.employmentType,
    department: row.department,
    city: row.city,
    summary: row.summary,
    highlights: present.highlights,
    sections: present.sections,
    meta: present.meta,
    sortOrder: row.sortOrder,
    status: row.status,
    authorId: row.authorId,
    authorName: authorName ?? "سایت",
    reviewNote: row.reviewNote,
    supersedesId: row.supersedesId,
    updatedAt: row.updatedAt,
    form: positionToForm({
      ...present,
      slug: row.supersedesId ? row.desiredSlug : row.slug,
      sortOrder: row.sortOrder,
    }),
  };
}

export async function getManagedPosition(
  user: { id: string; role: PositionActor["role"] },
  id: string,
) {
  const actor = actorFromUser(user);
  assertPositions(actor);
  const row = await loadPosition(id);
  if (!row || !canViewPosition(actor, row)) return null;

  const db = getDb();
  const [author] = row.authorId
    ? await db
        .select({ username: users.username })
        .from(users)
        .where(eq(users.id, row.authorId))
        .limit(1)
    : [];

  const events = await db
    .select({
      id: jobPositionEvents.id,
      action: jobPositionEvents.action,
      note: jobPositionEvents.note,
      actorName: users.username,
      createdAt: jobPositionEvents.createdAt,
    })
    .from(jobPositionEvents)
    .leftJoin(users, eq(jobPositionEvents.actorUserId, users.id))
    .where(eq(jobPositionEvents.positionId, row.id))
    .orderBy(desc(jobPositionEvents.createdAt))
    .limit(20);

  const history: PositionHistoryItem[] = events.map((event) => ({
    id: event.id,
    action: event.action,
    label: actionLabel(event.action),
    note: event.note,
    actorName: event.actorName,
    createdAt: event.createdAt.toISOString(),
  }));

  const openProposals = row.supersedesId
    ? []
    : await db
        .select({
          id: jobPositions.id,
          status: jobPositions.status,
          authorId: jobPositions.authorId,
          title: jobPositions.title,
        })
        .from(jobPositions)
        .where(
          and(
            eq(jobPositions.supersedesId, row.id),
            or(eq(jobPositions.status, "draft"), eq(jobPositions.status, "pending_review")),
          ),
        );

  const visibleProposal =
    openProposals.find((item) => actor.role === "admin" || item.authorId === actor.userId) ??
    null;

  return {
    position: toManaged(row, author?.username ?? null),
    history,
    openProposal: visibleProposal
      ? { id: visibleProposal.id, status: visibleProposal.status, title: visibleProposal.title }
      : null,
  };
}

function liveWrite(input: PositionFormInput) {
  const fields = positionFields(input);
  return { ...fields, slug: fields.desiredSlug };
}

export async function createManagedPosition(
  user: { id: string; role: PositionActor["role"] },
  input: PositionFormInput,
  action: "save" | "submit" | "publish",
) {
  const actor = actorFromUser(user);
  assertPositions(actor);

  try {
    return await getDb().transaction(async (tx) => {
      const [created] = await tx
        .insert(jobPositions)
        .values({
          ...liveWrite(input),
          status: "draft",
          authorId: actor.userId,
        })
        .returning();

      await tx.insert(jobPositionEvents).values({
        positionId: created.id,
        actorUserId: actor.userId,
        action: "created",
      });

      if (action === "save") return created;

      const decision = transitionPosition(actor, created, action);
      if (!decision.ok) throw new HttpError(decision.status, decision.message);

      const [updated] = await tx
        .update(jobPositions)
        .set(statusPatch(action, actor))
        .where(eq(jobPositions.id, created.id))
        .returning();

      await tx.insert(jobPositionEvents).values({
        positionId: created.id,
        actorUserId: actor.userId,
        action,
      });

      return updated;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "این نشانی قبلاً استفاده شده است.");
    }
    throw error;
  }
}

export async function proposePositionEdit(
  user: { id: string; role: PositionActor["role"] },
  sourceId: string,
) {
  const actor = actorFromUser(user);
  assertPositions(actor);
  const source = await loadPosition(sourceId);
  if (!source || !canViewPosition(actor, source)) {
    throw new HttpError(404, "موقعیت پیدا نشد.");
  }
  if (!canProposePosition(actor, source)) {
    throw new HttpError(403, "مدیر وب‌سایت موقعیت را مستقیم ویرایش می‌کند.");
  }

  return getDb().transaction(async (tx) => {
    const open = await tx
      .select()
      .from(jobPositions)
      .where(
        and(
          eq(jobPositions.supersedesId, source.id),
          or(eq(jobPositions.status, "draft"), eq(jobPositions.status, "pending_review")),
        ),
      );

    const own = open.find((item) => item.authorId === actor.userId);
    if (own) return own;
    if (open.length > 0) {
      throw new HttpError(409, "برای این موقعیت یک پیشنهاد در جریان است.");
    }

    const slug = await uniqueProposalSlug(tx, source.slug);
    const [created] = await tx
      .insert(jobPositions)
      .values({
        ...contentFromRow(source),
        slug,
        desiredSlug: source.slug,
        status: "draft",
        authorId: actor.userId,
        supersedesId: source.id,
        reviewerId: null,
        reviewNote: null,
        submittedAt: null,
        reviewedAt: null,
        publishedAt: null,
      })
      .returning();

    await tx.insert(jobPositionEvents).values({
      positionId: created.id,
      actorUserId: actor.userId,
      action: "created",
      note: "پیشنهاد ویرایش موقعیت منتشرشده",
    });

    return created;
  });
}

async function mergeProposal(
  tx: Pick<ReturnType<typeof getDb>, "update" | "insert" | "delete" | "select">,
  proposal: typeof jobPositions.$inferSelect,
  actor: PositionActor,
  action: "approve" | "publish",
) {
  const targetId = proposal.supersedesId;
  if (!targetId) return null;
  const [target] = await tx
    .select()
    .from(jobPositions)
    .where(eq(jobPositions.id, targetId))
    .limit(1);
  if (!target || target.supersedesId) {
    throw new HttpError(409, "موقعیت اصلی پیدا نشد.");
  }

  const now = new Date();
  await tx.delete(jobPositions).where(eq(jobPositions.id, proposal.id));
  const [updated] = await tx
    .update(jobPositions)
    .set({
      slug: proposal.desiredSlug,
      desiredSlug: proposal.desiredSlug,
      title: proposal.title,
      employmentType: proposal.employmentType,
      department: proposal.department,
      city: proposal.city,
      summary: proposal.summary,
      highlights: proposal.highlights,
      sections: proposal.sections,
      meta: proposal.meta,
      sortOrder: proposal.sortOrder,
      status: "approved",
      reviewerId: actor.userId,
      reviewedAt: now,
      publishedAt: now,
      reviewNote: null,
      updatedAt: now,
    })
    .where(eq(jobPositions.id, target.id))
    .returning();

  await tx.insert(jobPositionEvents).values({
    positionId: target.id,
    actorUserId: actor.userId,
    action,
    note: "پیشنهاد ویرایش اعمال شد",
  });
  return updated;
}

export async function updateManagedPosition(
  user: { id: string; role: PositionActor["role"] },
  id: string,
  input: PositionFormInput | undefined,
  action: "save" | PositionAction,
  note?: string,
) {
  const actor = actorFromUser(user);
  assertPositions(actor);
  const existing = await loadPosition(id);
  if (!existing || !canViewPosition(actor, existing)) {
    throw new HttpError(404, "موقعیت پیدا نشد.");
  }
  if (input && !canEditPosition(actor, existing)) {
    throw new HttpError(403, "این موقعیت در وضعیت فعلی قابل ویرایش نیست.");
  }
  if ((action === "save" || action === "submit" || action === "publish") && !input) {
    throw new HttpError(422, "اطلاعات موقعیت کامل نیست.");
  }

  try {
    return await getDb().transaction(async (tx) => {
      let current = existing;
      if (input) {
        const fields = positionFields(input);
        const [updated] = await tx
          .update(jobPositions)
          .set(
            current.supersedesId
              ? fields
              : { ...fields, slug: fields.desiredSlug },
          )
          .where(eq(jobPositions.id, existing.id))
          .returning();
        current = updated;
        await tx.insert(jobPositionEvents).values({
          positionId: existing.id,
          actorUserId: actor.userId,
          action: "updated",
        });
      }

      if (action === "save") return current;

      const decision = transitionPosition(actor, current, action, note);
      if (!decision.ok) throw new HttpError(decision.status, decision.message);

      if (
        current.supersedesId &&
        (action === "approve" || action === "publish")
      ) {
        const merged = await mergeProposal(tx, current, actor, action);
        if (!merged) throw new HttpError(409, "موقعیت اصلی پیدا نشد.");
        return merged;
      }

      const [reviewed] = await tx
        .update(jobPositions)
        .set(statusPatch(action, actor, note))
        .where(eq(jobPositions.id, existing.id))
        .returning();

      await tx.insert(jobPositionEvents).values({
        positionId: existing.id,
        actorUserId: actor.userId,
        action,
        note: action === "reject" ? note?.trim() : null,
      });

      return reviewed;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "این نشانی قبلاً استفاده شده است.");
    }
    throw error;
  }
}
