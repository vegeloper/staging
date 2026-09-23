import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";

import { closeDb, getDb } from "@/db";
import { siteDocuments, users } from "@/db/schema";
import type { AuthUser } from "@/lib/auth/session";
import { defaultTheme } from "@/lib/site/defaults";
import { loadPublishedSite, saveSiteDocument } from "@/lib/site/store";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("site documents", () => {
  const createdUserIds: string[] = [];
  let previous: Array<typeof siteDocuments.$inferSelect> = [];

  afterAll(async () => {
    if (!hasDb) return;
    await getDb().delete(siteDocuments).where(inArray(siteDocuments.key, ["theme", "copyright"]));
    if (previous.length > 0) {
      await getDb().insert(siteDocuments).values(previous);
    }
    if (createdUserIds.length > 0) {
      await getDb().delete(users).where(inArray(users.id, createdUserIds));
    }
    await closeDb();
  });

  async function makeUser(role: AuthUser["role"]) {
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

  it("publishes copyright and theme without exposing the draft", async () => {
    previous = await getDb()
      .select()
      .from(siteDocuments)
      .where(inArray(siteDocuments.key, ["theme", "copyright"]));
    const admin = await makeUser("admin");
    const operator = await makeUser("operator");
    const before = await loadPublishedSite();
    const draftText = `پیش‌نویس ${randomUUID()}`;
    const publishedText = `منتشرشده ${randomUUID()}`;

    await saveSiteDocument(admin, "copyright", { text: draftText }, "save");
    expect((await loadPublishedSite()).copyright).toBe(before.copyright);

    await expect(
      saveSiteDocument(operator, "copyright", { text: publishedText }, "publish"),
    ).rejects.toMatchObject({ status: 403 });

    const published = await saveSiteDocument(admin, "copyright", { text: publishedText }, "publish");
    expect(published.revision).toBeGreaterThan(0);
    expect((await loadPublishedSite()).copyright).toBe(publishedText);

    await saveSiteDocument(
      admin,
      "theme",
      { ...defaultTheme, colors: { ...defaultTheme.colors, brand: "#123456" } },
      "publish",
    );
    expect((await loadPublishedSite()).theme.colors.brand).toBe("#123456");

    await expect(
      saveSiteDocument(admin, "theme", { ...defaultTheme, background: { image: "/figma/../secret.png" } }, "publish"),
    ).rejects.toMatchObject({ status: 422 });
  });
});
