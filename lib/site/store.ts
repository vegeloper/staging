import { count, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { contentPosts, siteDocuments, submissions } from "@/db/schema";
import type { AuthUser } from "@/lib/auth/session";
import { fieldErrorsFromZod, HttpError } from "@/lib/http/errors";
import { assertThemeAssets, countMediaAssets } from "@/lib/media/library";

import {
  DEFAULT_COPYRIGHT,
  defaultPublishedSite,
  defaultTheme,
  type PublishedSite,
  type SiteTheme,
} from "./defaults";
import { parseCopyright, parseTheme } from "./theme";

export const siteDocumentKeys = ["theme", "copyright"] as const;
export type SiteDocumentKey = (typeof siteDocumentKeys)[number];

function cloneTheme(theme: SiteTheme): SiteTheme {
  return {
    colors: { ...theme.colors },
    background: { ...theme.background },
    media: { ...theme.media },
  };
}

export async function loadPublishedSite(): Promise<PublishedSite> {
  const rows = await getDb().select().from(siteDocuments);
  const result: PublishedSite = {
    ...defaultPublishedSite,
    theme: cloneTheme(defaultTheme),
  };

  for (const row of rows) {
    if (row.key === "theme") {
      const parsed = parseTheme(row.published);
      if (parsed.success) {
        result.theme = parsed.data;
        result.themeRevision = row.revision;
      }
    }
    if (row.key === "copyright") {
      const parsed = parseCopyright(row.published);
      if (parsed.success) {
        result.copyright = parsed.data.text;
        result.copyrightRevision = row.revision;
      }
    }
  }

  return result;
}

function assertAdmin(user: AuthUser) {
  if (user.role !== "admin") {
    throw new HttpError(403, "فقط مدیر وب‌سایت می‌تواند پوسته و کپی‌رایت را تغییر دهد.");
  }
}

function parseDocument(key: SiteDocumentKey, input: unknown) {
  if (key === "theme") {
    const parsed = parseTheme(input);
    if (!parsed.success) {
      throw new HttpError(422, "تنظیمات پوسته نامعتبر است.", {
        fields: fieldErrorsFromZod(parsed.error),
      });
    }
    return parsed.data;
  }

  const parsed = parseCopyright(input);
  if (!parsed.success) {
    throw new HttpError(422, "متن کپی‌رایت نامعتبر است.", {
      fields: fieldErrorsFromZod(parsed.error),
    });
  }
  return parsed.data;
}

export async function saveSiteDocument(
  user: AuthUser,
  key: SiteDocumentKey,
  input: unknown,
  action: "save" | "publish",
) {
  assertAdmin(user);
  const value = parseDocument(key, input);
  if (key === "theme") await assertThemeAssets(value as SiteTheme);
  const now = new Date();

  return getDb().transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(siteDocuments)
      .where(eq(siteDocuments.key, key))
      .limit(1);
    const revision = action === "publish" ? (existing?.revision ?? 0) + 1 : (existing?.revision ?? 0);
    const published = action === "publish" ? value : (existing?.published ?? null);
    const publishedAt = action === "publish" ? now : (existing?.publishedAt ?? null);

    if (!existing) {
      await tx.insert(siteDocuments).values({
        key,
        draft: value,
        published,
        revision,
        publishedAt,
        updatedBy: user.id,
        updatedAt: now,
      });
    } else {
      await tx
        .update(siteDocuments)
        .set({
          draft: value,
          published,
          revision,
          publishedAt,
          updatedBy: user.id,
          updatedAt: now,
        })
        .where(eq(siteDocuments.key, key));
    }

    return {
      revision,
      publishedAt: publishedAt ? publishedAt.toISOString() : null,
    };
  });
}

export async function readThemeDocument() {
  const [row] = await getDb()
    .select()
    .from(siteDocuments)
    .where(eq(siteDocuments.key, "theme"))
    .limit(1);
  const draft = parseTheme(row?.draft);
  const published = parseTheme(row?.published);
  return {
    draft: draft.success ? draft.data : cloneTheme(defaultTheme),
    published: published.success ? published.data : cloneTheme(defaultTheme),
    revision: row?.revision ?? 0,
    publishedAt: row?.publishedAt?.toISOString() ?? null,
  };
}

export async function readCopyrightDocument() {
  const [row] = await getDb()
    .select()
    .from(siteDocuments)
    .where(eq(siteDocuments.key, "copyright"))
    .limit(1);
  const draft = parseCopyright(row?.draft);
  const published = parseCopyright(row?.published);
  return {
    draft: draft.success ? draft.data.text : DEFAULT_COPYRIGHT,
    published: published.success ? published.data.text : DEFAULT_COPYRIGHT,
    revision: row?.revision ?? 0,
    publishedAt: row?.publishedAt?.toISOString() ?? null,
  };
}

export async function adminOverviewCounts() {
  const db = getDb();
  const [submissionRow] = await db
    .select({ total: count() })
    .from(submissions)
    .where(eq(submissions.status, "new"));
  const [contentRow] = await db
    .select({ total: count() })
    .from(contentPosts)
    .where(eq(contentPosts.status, "pending_review"));
  const published = await loadPublishedSite();
  const mediaCount = await countMediaAssets();
  return {
    newSubmissions: Number(submissionRow?.total ?? 0),
    pendingContent: Number(contentRow?.total ?? 0),
    mediaCount,
    copyright: published.copyright,
    themeRevision: published.themeRevision,
    copyrightRevision: published.copyrightRevision,
  };
}
