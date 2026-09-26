import { describe, expect, it } from "vitest";

import { articles } from "@/lib/articles";
import { expandBlocks, parseBody, serializeBody } from "@/lib/cms/body";
import { parseInline, plainText, safeHref } from "@/lib/cms/inline";
import { starterCatalog } from "@/lib/cms/catalog";
import { contentImageSrcs } from "@/lib/cms/images";
import { contentFormSchema } from "@/lib/cms/input";
import {
  editorPermissions,
  transitionContent,
  type CmsActor,
  type ContentAccessRecord,
} from "@/lib/cms/workflow";

const creator: CmsActor = { userId: "creator-1", role: "content_creator" };
const otherCreator: CmsActor = { userId: "creator-2", role: "content_creator" };
const admin: CmsActor = { userId: "admin-1", role: "admin" };
const operator: CmsActor = { userId: "operator-1", role: "operator" };

function post(status: ContentAccessRecord["status"], authorId = creator.userId): ContentAccessRecord {
  return { authorId, status };
}

describe("content workflow", () => {
  it("lets a creator submit and resubmit only their own draft or rejected post", () => {
    expect(transitionContent(creator, post("draft"), "submit").ok).toBe(true);
    expect(transitionContent(creator, post("rejected"), "submit").ok).toBe(true);
    expect(transitionContent(creator, post("pending_review"), "submit").ok).toBe(false);
    expect(transitionContent(creator, post("approved"), "submit").ok).toBe(false);
    expect(transitionContent(otherCreator, post("draft"), "submit")).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("keeps publishing and rejection with the website admin", () => {
    expect(transitionContent(creator, post("pending_review"), "approve")).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(transitionContent(creator, post("draft"), "publish")).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(transitionContent(operator, post("pending_review"), "approve")).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(transitionContent(admin, post("pending_review"), "approve")).toMatchObject({
      ok: true,
      status: "approved",
    });
    expect(transitionContent(admin, post("draft"), "publish")).toMatchObject({
      ok: true,
      status: "approved",
    });
    expect(transitionContent(admin, post("pending_review"), "reject")).toMatchObject({
      ok: false,
      status: 422,
    });
    expect(transitionContent(admin, post("pending_review"), "reject", "نیاز به منبع")).toMatchObject({
      ok: true,
      status: "rejected",
    });
  });

  it("lets the author withdraw a pending post and the admin unpublish a live one", () => {
    expect(transitionContent(creator, post("pending_review"), "withdraw")).toMatchObject({
      ok: true,
      status: "draft",
    });
    expect(transitionContent(otherCreator, post("pending_review"), "withdraw").ok).toBe(false);
    expect(transitionContent(admin, post("approved"), "unpublish")).toMatchObject({
      ok: true,
      status: "draft",
    });
    expect(transitionContent(creator, post("approved"), "unpublish")).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("hides review actions from creators and shows them to the admin", () => {
    const creatorPermissions = editorPermissions(creator, post("pending_review"));
    expect(creatorPermissions.canApprove).toBe(false);
    expect(creatorPermissions.canReject).toBe(false);
    expect(creatorPermissions.canEdit).toBe(false);
    expect(creatorPermissions.canWithdraw).toBe(true);

    const adminPermissions = editorPermissions(admin, post("pending_review"));
    expect(adminPermissions.canApprove).toBe(true);
    expect(adminPermissions.canReject).toBe(true);
    expect(adminPermissions.canEdit).toBe(true);

    expect(editorPermissions(operator, null).canEdit).toBe(false);
  });
});

describe("content catalog", () => {
  it("turns the static feed into reviewable news and articles", () => {
    const catalog = starterCatalog();
    expect(catalog).toHaveLength(articles.length + 3);
    expect(catalog.find((item) => item.slug === "partnership-phase-two")?.homeLead).toBe(true);
    expect(catalog.find((item) => item.slug === "online-trips")).toMatchObject({
      kind: "article",
      category: "مقالات",
      featured: true,
    });
    expect(catalog.find((item) => item.slug === "tehran-fleet-expansion")?.kind).toBe("news");
    for (const item of catalog) {
      expect(
        contentImageSrcs.includes(item.imageSrc) || item.imageSrc.startsWith("/news/"),
      ).toBe(true);
    }
  });

  it("round-trips article body text and rejects a mismatched category", () => {
    const body = parseBody(
      "بند اول\n\n# عنوان اصلی\n\n## تیتر\n\n### کوچکتر\n\n#### باز هم کوچکتر\n\n##### ریز\n\nبند دوم",
    );
    expect(body).toEqual([
      { type: "p", text: "بند اول" },
      { type: "title", text: "عنوان اصلی" },
      { type: "h2", text: "تیتر" },
      { type: "h3", text: "کوچکتر" },
      { type: "h4", text: "باز هم کوچکتر" },
      { type: "h5", text: "ریز" },
      { type: "p", text: "بند دوم" },
    ]);
    expect(parseBody(serializeBody(body))).toEqual(body);
    expect(parseBody("## فقط تیتر\nاین جمله عنوان نیست.")).toEqual([
      { type: "h2", text: "فقط تیتر" },
      { type: "p", text: "این جمله عنوان نیست." },
    ]);
    expect(expandBlocks([{ type: "h2", text: "تیتر\\nجمله بعدی" }])).toEqual([
      { type: "h2", text: "تیتر" },
      { type: "p", text: "جمله بعدی" },
    ]);
    expect(parseInline("یک **کلمه** و ++خط++ و [دات‌وان](https://dotone.ir)")).toEqual([
      { text: "یک " },
      { text: "کلمه", bold: true },
      { text: " و " },
      { text: "خط", underline: true },
      { text: " و " },
      { text: "دات‌وان", href: "https://dotone.ir/" },
    ]);
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("/blog/city-news")).toBe("/blog/city-news");
    expect(plainText("**درشت** [پیوند](/blog/x)")).toBe("درشت پیوند");

    const parsed = contentFormSchema.safeParse({
      kind: "article",
      category: "اخبار",
      title: "عنوان مطلب",
      slug: "city-news",
      displayDate: "امروز",
      imageSrc: contentImageSrcs[0],
      imageAlt: "تصویر مطلب",
      bodyText: "متن مطلب برای انتشار.",
    });
    expect(parsed.success).toBe(false);
  });
});
