import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { contentEvents, contentPosts, contentSettings, users } from "@/db/schema";
import { canAccessCms } from "@/lib/auth/rbac";
import { HttpError } from "@/lib/http/errors";
import { parseUuid } from "@/lib/http/body";
import { sanitizeSearchQuery } from "@/lib/forms/shared";
import { assertLibraryImage } from "@/lib/media/library";

import { parseBody, serializeBody } from "./body";
import {
  arrangeFeeds,
  fallbackFeeds,
  normalizeCategory,
  relatedArticles,
  seedToPublic,
  starterCatalog,
  type PublicArticle,
} from "./catalog";
import type { ContentFormInput } from "./input";
import {
  canEditContent,
  canViewContent,
  contentKinds,
  contentStatuses,
  transitionContent,
  type CmsAction,
  type CmsActor,
  type ContentKind,
  type ContentStatus,
} from "./workflow";

const PAGE_SIZE = 20;
let catalogReady = false;

export type ManagedContentSummary = {
  id: string;
  slug: string;
  title: string;
  kind: ContentKind;
  category: string;
  status: ContentStatus;
  authorName: string;
  updatedAt: Date;
  reviewNote: string | null;
};

export type ManagedContent = {
  id: string;
  slug: string;
  kind: ContentKind;
  category: ContentFormInput["category"];
  title: string;
  displayDate: string;
  commentsLabel: string;
  likesLabel: string;
  imageSrc: string;
  imageAlt: string;
  imageObjectPosition: string;
  bodyText: string;
  featured: boolean;
  status: ContentStatus;
  authorId: string | null;
  authorName: string;
  reviewNote: string | null;
  updatedAt: Date;
};

export type ContentHistoryItem = {
  id: string;
  action: string;
  note: string | null;
  actorName: string | null;
  createdAt: string;
};

function actorFromUser(user: { id: string; role: CmsActor["role"] }): CmsActor {
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

function assertCms(actor: CmsActor) {
  if (!canAccessCms(actor.role)) {
    throw new HttpError(403, "به بخش مطالب دسترسی ندارید.");
  }
}

export async function ensureStarterCatalog() {
  if (catalogReady) return;
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(814270)`);
    const [marker] = await tx
      .select({ id: contentSettings.id })
      .from(contentSettings)
      .where(eq(contentSettings.id, "starter-catalog"))
      .limit(1);
    if (marker) return;

    const publishedAt = new Date();
    await tx
      .insert(contentPosts)
      .values(
        starterCatalog().map((item) => ({
          slug: item.slug,
          kind: item.kind,
          category: item.category,
          title: item.title,
          displayDate: item.displayDate,
          commentsLabel: item.commentsLabel,
          likesLabel: item.likesLabel,
          imageSrc: item.imageSrc,
          imageAlt: item.imageAlt,
          imageObjectPosition: item.imageObjectPosition,
          body: item.body,
          featured: item.featured,
          sortOrder: item.sortOrder,
          status: "approved" as const,
          publishedAt,
        })),
      )
      .onConflictDoNothing({ target: contentPosts.slug });
    await tx.insert(contentSettings).values({ id: "starter-catalog" });
  });
  catalogReady = true;
}

function rowToPublic(row: typeof contentPosts.$inferSelect): PublicArticle {
  return {
    id: row.slug,
    category: normalizeCategory(row.category),
    title: row.title,
    date: row.displayDate,
    comments: row.commentsLabel,
    likes: row.likesLabel,
    image: {
      src: row.imageSrc,
      alt: row.imageAlt,
      objectPosition: row.imageObjectPosition ?? undefined,
    },
    body: Array.isArray(row.body) ? row.body : [],
    kind: row.kind,
    featured: row.featured,
    publishedAtMs: row.publishedAt?.getTime() ?? row.createdAt.getTime(),
    sortOrder: row.sortOrder,
  };
}

export async function getPublicFeeds() {
  if (!process.env.DATABASE_URL) return fallbackFeeds();

  try {
    await ensureStarterCatalog();
    const rows = await getDb()
      .select()
      .from(contentPosts)
      .where(eq(contentPosts.status, "approved"))
      .orderBy(desc(contentPosts.publishedAt), asc(contentPosts.sortOrder));
    return arrangeFeeds(rows.map(rowToPublic));
  } catch (error) {
    console.error("Published content fell back to the static catalog.", error);
    return fallbackFeeds();
  }
}

export async function getPublishedArticle(slug: string) {
  if (!process.env.DATABASE_URL) {
    const published = starterCatalog().map(seedToPublic);
    const article = published.find((item) => item.id === slug);
    if (!article) return null;
    return { article, related: relatedArticles(published, slug) };
  }

  try {
    await ensureStarterCatalog();
    const rows = await getDb()
      .select()
      .from(contentPosts)
      .where(eq(contentPosts.status, "approved"))
      .orderBy(desc(contentPosts.publishedAt), asc(contentPosts.sortOrder));
    const published = rows.map(rowToPublic);
    const article = published.find((item) => item.id === slug);
    if (!article) return null;
    return { article, related: relatedArticles(published, slug) };
  } catch (error) {
    console.error("Article detail fell back to the static catalog.", error);
    const published = starterCatalog().map(seedToPublic);
    const article = published.find((item) => item.id === slug);
    if (!article) return null;
    return { article, related: relatedArticles(published, slug) };
  }
}

function postFields(input: ContentFormInput) {
  return {
    slug: input.slug,
    kind: input.kind,
    category: input.category,
    title: input.title,
    displayDate: input.displayDate,
    commentsLabel: input.commentsLabel,
    likesLabel: input.likesLabel,
    imageSrc: input.imageSrc,
    imageAlt: input.imageAlt,
    imageObjectPosition: input.imageObjectPosition || null,
    body: parseBody(input.bodyText),
    featured: input.featured,
    updatedAt: new Date(),
  };
}

function statusPatch(action: CmsAction, actor: CmsActor, note?: string) {
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

async function loadPost(id: string) {
  const postId = parseUuid(id);
  if (!postId) return null;
  const [row] = await getDb()
    .select()
    .from(contentPosts)
    .where(eq(contentPosts.id, postId))
    .limit(1);
  return row ?? null;
}

export async function listManagedContent(
  user: { id: string; role: CmsActor["role"] },
  filters: {
    kind?: string;
    status?: string;
    query?: string;
    page?: number;
  },
) {
  const actor = actorFromUser(user);
  assertCms(actor);
  await ensureStarterCatalog();

  const kind = contentKinds.find((value) => value === filters.kind);
  const status = contentStatuses.find((value) => value === filters.status);
  const query = filters.query ? sanitizeSearchQuery(filters.query) : "";
  const filtersSql = [
    actor.role === "content_creator" ? eq(contentPosts.authorId, actor.userId) : undefined,
    kind ? eq(contentPosts.kind, kind) : undefined,
    status ? eq(contentPosts.status, status) : undefined,
    query
      ? or(ilike(contentPosts.title, `%${query}%`), ilike(contentPosts.slug, `%${query}%`))
      : undefined,
  ].filter((clause) => clause !== undefined);
  const where = filtersSql.length > 0 ? and(...filtersSql) : undefined;

  const db = getDb();
  const [totalRow] = await db.select({ total: count() }).from(contentPosts).where(where);
  const total = Number(totalRow?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(filters.page ?? 1, 1), totalPages);

  const rows = await db
    .select({
      id: contentPosts.id,
      slug: contentPosts.slug,
      title: contentPosts.title,
      kind: contentPosts.kind,
      category: contentPosts.category,
      status: contentPosts.status,
      authorName: users.username,
      updatedAt: contentPosts.updatedAt,
      reviewNote: contentPosts.reviewNote,
    })
    .from(contentPosts)
    .leftJoin(users, eq(contentPosts.authorId, users.id))
    .where(where)
    .orderBy(desc(contentPosts.updatedAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const items: ManagedContentSummary[] = rows.map((row) => ({
    ...row,
    authorName: row.authorName ?? "سایت",
  }));

  return { items, page, total, totalPages, pageSize: PAGE_SIZE };
}

function toManaged(
  row: typeof contentPosts.$inferSelect,
  authorName: string | null,
): ManagedContent {
  const category = row.category;
  if (
    category !== "مقالات" &&
    category !== "راهنما" &&
    category !== "اطلاعیه" &&
    category !== "اخبار"
  ) {
    throw new HttpError(500, "دسته مطلب نامعتبر است.");
  }

  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    category,
    title: row.title,
    displayDate: row.displayDate,
    commentsLabel: row.commentsLabel,
    likesLabel: row.likesLabel,
    imageSrc: row.imageSrc,
    imageAlt: row.imageAlt,
    imageObjectPosition: row.imageObjectPosition ?? "",
    bodyText: serializeBody(Array.isArray(row.body) ? row.body : []),
    featured: row.featured,
    status: row.status,
    authorId: row.authorId,
    authorName: authorName ?? "سایت",
    reviewNote: row.reviewNote,
    updatedAt: row.updatedAt,
  };
}

export async function getManagedContent(
  user: { id: string; role: CmsActor["role"] },
  id: string,
) {
  const actor = actorFromUser(user);
  assertCms(actor);
  const row = await loadPost(id);
  if (!row || !canViewContent(actor, row)) return null;

  const [author] = row.authorId
    ? await getDb()
        .select({ username: users.username })
        .from(users)
        .where(eq(users.id, row.authorId))
        .limit(1)
    : [];

  const events = await getDb()
    .select({
      id: contentEvents.id,
      action: contentEvents.action,
      note: contentEvents.note,
      actorName: users.username,
      createdAt: contentEvents.createdAt,
    })
    .from(contentEvents)
    .leftJoin(users, eq(contentEvents.actorUserId, users.id))
    .where(eq(contentEvents.postId, row.id))
    .orderBy(desc(contentEvents.createdAt))
    .limit(20);

  const history: ContentHistoryItem[] = events.map((event) => ({
    id: event.id,
    action: event.action,
    note: event.note,
    actorName: event.actorName,
    createdAt: event.createdAt.toISOString(),
  }));

  return { post: toManaged(row, author?.username ?? null), history };
}

export async function createManagedContent(
  user: { id: string; role: CmsActor["role"] },
  input: ContentFormInput,
  action: "save" | "submit" | "publish",
) {
  const actor = actorFromUser(user);
  assertCms(actor);
  await assertLibraryImage(input.imageSrc);

  try {
    return await getDb().transaction(async (tx) => {
      const [created] = await tx
        .insert(contentPosts)
        .values({
          ...postFields(input),
          status: "draft",
          authorId: actor.userId,
        })
        .returning();

      await tx.insert(contentEvents).values({
        postId: created.id,
        actorUserId: actor.userId,
        action: "created",
      });

      if (action === "save") return created;

      const decision = transitionContent(actor, created, action);
      if (!decision.ok) throw new HttpError(decision.status, decision.message);

      const [updated] = await tx
        .update(contentPosts)
        .set(statusPatch(action, actor))
        .where(eq(contentPosts.id, created.id))
        .returning();

      await tx.insert(contentEvents).values({
        postId: created.id,
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

export async function updateManagedContent(
  user: { id: string; role: CmsActor["role"] },
  id: string,
  input: ContentFormInput | undefined,
  action: "save" | CmsAction,
  note?: string,
) {
  const actor = actorFromUser(user);
  assertCms(actor);
  const existing = await loadPost(id);
  if (!existing || !canViewContent(actor, existing)) {
    throw new HttpError(404, "مطلب پیدا نشد.");
  }

  if (input && !canEditContent(actor, existing)) {
    throw new HttpError(403, "این مطلب در وضعیت فعلی قابل ویرایش نیست.");
  }
  if (action === "save" && !input) {
    throw new HttpError(422, "اطلاعات مطلب کامل نیست.");
  }
  if ((action === "save" || action === "submit" || action === "publish") && !input) {
    throw new HttpError(422, "اطلاعات مطلب کامل نیست.");
  }
  if (input) await assertLibraryImage(input.imageSrc);

  try {
    return await getDb().transaction(async (tx) => {
      let current = existing;
      if (input) {
        const [updated] = await tx
          .update(contentPosts)
          .set(postFields(input))
          .where(eq(contentPosts.id, existing.id))
          .returning();
        current = updated;
        await tx.insert(contentEvents).values({
          postId: existing.id,
          actorUserId: actor.userId,
          action: "updated",
        });
      }

      if (action === "save") return current;

      const decision = transitionContent(actor, current, action, note);
      if (!decision.ok) throw new HttpError(decision.status, decision.message);

      const [reviewed] = await tx
        .update(contentPosts)
        .set(statusPatch(action, actor, note))
        .where(eq(contentPosts.id, existing.id))
        .returning();

      await tx.insert(contentEvents).values({
        postId: existing.id,
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
