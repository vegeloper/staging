import { describe, expect, it } from "vitest";

import { articles } from "@/lib/articles";
import { parseBody, serializeBody } from "@/lib/cms/body";
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
    expect(catalog).toHaveLength(articles.length);
    expect(catalog.find((item) => item.slug === "online-trips")).toMatchObject({
      kind: "article",
      category: "مقالات",
      featured: true,
    });
    expect(catalog.find((item) => item.slug === "intercity")?.kind).toBe("news");
    for (const item of catalog) {
      expect(contentImageSrcs).toContain(item.imageSrc);
    }
  });

  it("round-trips article body text and rejects a mismatched category", () => {
    const body = parseBody("بند اول\n\n## تیتر\n\nبند دوم");
    expect(body).toEqual([
      { type: "p", text: "بند اول" },
      { type: "h2", text: "تیتر" },
      { type: "p", text: "بند دوم" },
    ]);
    expect(parseBody(serializeBody(body))).toEqual(body);

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
