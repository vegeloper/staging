import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";

import { closeDb, getDb } from "@/db";
import { contentPosts, users } from "@/db/schema";
import { getPublicFeeds, getPublishedArticle } from "@/lib/cms/service";
import {
  createManagedContent,
  listManagedContent,
  updateManagedContent,
} from "@/lib/cms/service";
import { contentImageSrcs } from "@/lib/cms/images";
import type { ContentFormInput } from "@/lib/cms/input";
import { HttpError } from "@/lib/http/errors";

const hasDb = Boolean(process.env.DATABASE_URL);

function draft(slug: string): ContentFormInput {
  return {
    kind: "article",
    category: "مقالات",
    title: "مطلب آزمایشی سامانه",
    slug,
    displayDate: "امروز",
    commentsLabel: "۰",
    likesLabel: "۰",
    imageSrc: contentImageSrcs[0],
    imageAlt: "تصویر آزمایشی",
    imageObjectPosition: "",
    bodyText: "این متن برای آزمون گردش‌کار تأیید محتوا نوشته شده است.",
    featured: false,
  };
}

describe.skipIf(!hasDb)("cms service", () => {
  const createdUserIds: string[] = [];
  const slugs: string[] = [];

  afterAll(async () => {
    if (slugs.length > 0) {
      await getDb().delete(contentPosts).where(inArray(contentPosts.slug, slugs));
    }
    if (createdUserIds.length > 0) {
      await getDb().delete(users).where(inArray(users.id, createdUserIds));
    }
    await closeDb();
  });

  async function makeUser(role: "admin" | "operator" | "content_creator") {
    const [user] = await getDb()
      .insert(users)
      .values({
        username: `${role}-${randomUUID()}`,
        passwordHash: "not-used",
        role,
      })
      .returning();
    createdUserIds.push(user.id);
    return user;
  }

  it("publishes only after the website admin approves a creator submission", async () => {
    const creator = await makeUser("content_creator");
    const admin = await makeUser("admin");
    const operator = await makeUser("operator");
    const slug = `cms-${randomUUID().slice(0, 8)}`;
    slugs.push(slug);

    const created = await createManagedContent(creator, draft(slug), "save");
    expect(created.status).toBe("draft");

    await expect(updateManagedContent(creator, created.id, draft(slug), "publish")).rejects.toMatchObject({
      status: 403,
    });

    const pending = await updateManagedContent(creator, created.id, draft(slug), "submit");
    expect(pending.status).toBe("pending_review");

    await expect(listManagedContent(operator, {})).rejects.toBeInstanceOf(HttpError);

    const creatorList = await listManagedContent(creator, { query: slug });
    expect(creatorList.items.map((item) => item.slug)).toEqual([slug]);

    const hidden = await getPublishedArticle(slug);
    expect(hidden).toBeNull();

    const rejected = await updateManagedContent(
      admin,
      created.id,
      undefined,
      "reject",
      "منبع خبر را اضافه کنید",
    );
    expect(rejected.status).toBe("rejected");

    const resubmitted = await updateManagedContent(
      creator,
      created.id,
      {
        ...draft(slug),
        bodyText: "متن اصلاح‌شده با منبع داخلی برای انتشار آزمایشی.",
      },
      "submit",
    );
    expect(resubmitted.status).toBe("pending_review");

    const published = await updateManagedContent(admin, created.id, undefined, "approve");
    expect(published.status).toBe("approved");

    const article = await getPublishedArticle(slug);
    expect(article?.article.title).toBe("مطلب آزمایشی سامانه");

    const feeds = await getPublicFeeds();
    expect(feeds.articles.some((item) => item.id === slug)).toBe(true);
    expect(feeds.articles.some((item) => item.id === "online-trips")).toBe(true);
    expect(feeds.news.some((item) => item.id === "intercity")).toBe(true);

    const withdrawn = await updateManagedContent(admin, created.id, undefined, "unpublish");
    expect(withdrawn.status).toBe("draft");
    expect(await getPublishedArticle(slug)).toBeNull();
  });
});
