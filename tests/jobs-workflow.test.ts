import { describe, expect, it } from "vitest";

import { starterPositions } from "@/lib/jobs/catalog";
import { positionFormSchema, positionToForm } from "@/lib/jobs/input";
import { toCorporateCard } from "@/lib/jobs/present";
import {
  canProposePosition,
  editorPermissions,
  transitionPosition,
  type PositionAccessRecord,
  type PositionActor,
} from "@/lib/jobs/workflow";

const operator: PositionActor = { userId: "operator-1", role: "operator" };
const otherOperator: PositionActor = { userId: "operator-2", role: "operator" };
const admin: PositionActor = { userId: "admin-1", role: "admin" };
const creator: PositionActor = { userId: "creator-1", role: "content_creator" };

function position(
  status: PositionAccessRecord["status"],
  authorId: string | null = operator.userId,
  supersedesId: string | null = null,
): PositionAccessRecord {
  return { authorId, status, supersedesId };
}

describe("job position workflow", () => {
  it("lets an operator submit and resubmit only their own draft or rejected position", () => {
    expect(transitionPosition(operator, position("draft"), "submit").ok).toBe(true);
    expect(transitionPosition(operator, position("rejected"), "submit").ok).toBe(true);
    expect(transitionPosition(operator, position("pending_review"), "submit").ok).toBe(false);
    expect(transitionPosition(operator, position("approved"), "submit").ok).toBe(false);
    expect(transitionPosition(otherOperator, position("draft"), "submit")).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("keeps publishing and rejection with the website admin", () => {
    expect(transitionPosition(operator, position("pending_review"), "approve")).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(transitionPosition(operator, position("draft"), "publish")).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(transitionPosition(creator, position("pending_review"), "approve")).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(transitionPosition(admin, position("pending_review"), "approve")).toMatchObject({
      ok: true,
      status: "approved",
    });
    expect(transitionPosition(admin, position("draft"), "publish")).toMatchObject({
      ok: true,
      status: "approved",
    });
    expect(transitionPosition(admin, position("pending_review"), "reject")).toMatchObject({
      ok: false,
      status: 422,
    });
    expect(
      transitionPosition(admin, position("pending_review"), "reject", "عنوان دقیق‌تر شود"),
    ).toMatchObject({
      ok: true,
      status: "rejected",
    });
  });

  it("lets the operator withdraw a pending position and the admin unpublish a live one", () => {
    expect(transitionPosition(operator, position("pending_review"), "withdraw")).toMatchObject({
      ok: true,
      status: "draft",
    });
    expect(transitionPosition(otherOperator, position("pending_review"), "withdraw").ok).toBe(false);
    expect(transitionPosition(admin, position("approved", null), "unpublish")).toMatchObject({
      ok: true,
      status: "draft",
    });
    expect(transitionPosition(operator, position("approved", null), "unpublish")).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("hides review actions from operators and shows a direct publish path to the admin", () => {
    const operatorPending = editorPermissions(operator, position("pending_review"));
    expect(operatorPending.canApprove).toBe(false);
    expect(operatorPending.canReject).toBe(false);
    expect(operatorPending.canEdit).toBe(false);
    expect(operatorPending.canWithdraw).toBe(true);
    expect(operatorPending.canPropose).toBe(false);

    const adminPending = editorPermissions(admin, position("pending_review"));
    expect(adminPending.canApprove).toBe(true);
    expect(adminPending.canReject).toBe(true);
    expect(adminPending.canEdit).toBe(true);

    const creating = editorPermissions(admin, null);
    expect(creating.canPublish).toBe(true);
    expect(creating.canEdit).toBe(true);
    expect(editorPermissions(operator, null).canPublish).toBe(false);
    expect(editorPermissions(operator, null).canSubmit).toBe(true);
    expect(editorPermissions(creator, null).canEdit).toBe(false);
  });

  it("sends operator edits of a live position through a proposal instead of a direct save", () => {
    const live = position("approved", admin.userId);
    expect(canProposePosition(operator, live)).toBe(true);
    expect(editorPermissions(operator, live).canEdit).toBe(false);
    expect(editorPermissions(operator, live).canPropose).toBe(true);
    expect(editorPermissions(admin, live).canEdit).toBe(true);
    expect(editorPermissions(admin, live).canPropose).toBe(false);
    expect(canProposePosition(operator, position("approved", operator.userId, "live-id"))).toBe(
      false,
    );
  });
});

describe("job position catalog", () => {
  it("keeps the organizational openings as the starter catalog", () => {
    const catalog = starterPositions();
    expect(catalog).toHaveLength(12);
    expect(catalog.find((item) => item.slug === "frontend-developer")).toMatchObject({
      title: "توسعه‌دهنده Front-End",
      employmentType: "تمام وقت",
      city: "تهران",
    });
    expect(toCorporateCard(catalog[0]).id).toBe(catalog[0].slug);
  });

  it("round-trips the editor fields and rejects a bad address", () => {
    const seed = starterPositions()[0];
    const form = positionToForm({ ...seed, employmentType: seed.employmentType });
    expect(form.slug).toBe("frontend-developer");
    expect(form.highlightsText).toContain("تهران");
    expect(form.metaText).toContain("نوع همکاری | تمام وقت");

    const parsed = positionFormSchema.safeParse({
      ...form,
      slug: "Not A Slug",
    });
    expect(parsed.success).toBe(false);
  });
});
