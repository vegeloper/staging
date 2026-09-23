import { canManagePositions, type UserRole } from "@/lib/auth/rbac";

import {
  contentStatuses,
  contentStatusLabels,
  type CmsAction,
  type ContentStatus,
} from "@/lib/cms/workflow";

export const positionStatuses = contentStatuses;
export const positionStatusLabels = contentStatusLabels;
export type PositionStatus = ContentStatus;
export type PositionAction = CmsAction;

export const employmentTypes = [
  "تمام وقت",
  "پاره‌وقت",
  "شیفتی",
  "قراردادی",
  "کارآموزی",
] as const;
export type EmploymentType = (typeof employmentTypes)[number];

export type PositionActor = {
  userId: string;
  role: UserRole;
};

export type PositionAccessRecord = {
  authorId: string | null;
  status: PositionStatus;
  supersedesId: string | null;
};

export type TransitionResult =
  | { ok: true; status: PositionStatus }
  | { ok: false; status: 403 | 409 | 422; message: string };

const closed: TransitionResult = {
  ok: false,
  status: 403,
  message: "به بخش موقعیت‌های شغلی دسترسی ندارید.",
};

export function canReviewPositions(role: UserRole) {
  return role === "admin";
}

export function canViewPosition(actor: PositionActor, position: PositionAccessRecord) {
  if (actor.role === "admin") return true;
  if (actor.role !== "operator") return false;
  if (position.authorId === actor.userId) return true;
  return position.status === "approved" && position.supersedesId === null;
}

export function canEditPosition(actor: PositionActor, position: PositionAccessRecord) {
  if (!canViewPosition(actor, position)) return false;
  if (actor.role === "admin") return true;
  if (position.authorId !== actor.userId) return false;
  return position.status === "draft" || position.status === "rejected";
}

export function canProposePosition(actor: PositionActor, position: PositionAccessRecord) {
  if (actor.role !== "operator") return false;
  if (!canViewPosition(actor, position)) return false;
  return position.status === "approved" && position.supersedesId === null;
}

export function transitionPosition(
  actor: PositionActor,
  position: PositionAccessRecord,
  action: PositionAction,
  note?: string,
): TransitionResult {
  if (!canManagePositions(actor.role)) return closed;
  if (!canViewPosition(actor, position)) {
    return { ok: false, status: 403, message: "به این موقعیت دسترسی ندارید." };
  }

  if (action === "submit") {
    if (actor.role !== "admin" && actor.role !== "operator") {
      return { ok: false, status: 403, message: "اجازه ارسال موقعیت را ندارید." };
    }
    if (position.status !== "draft" && position.status !== "rejected") {
      return {
        ok: false,
        status: 409,
        message: "فقط پیش‌نویس یا موقعیت رد شده را می‌توان برای تأیید فرستاد.",
      };
    }
    if (actor.role === "operator" && position.authorId !== actor.userId) {
      return { ok: false, status: 403, message: "فقط پیشنهاددهنده می‌تواند این موقعیت را بفرستد." };
    }
    return { ok: true, status: "pending_review" };
  }

  if (action === "withdraw") {
    if (position.status !== "pending_review") {
      return {
        ok: false,
        status: 409,
        message: "فقط موقعیت در انتظار تأیید را می‌توان پس گرفت.",
      };
    }
    if (actor.role !== "admin" && position.authorId !== actor.userId) {
      return { ok: false, status: 403, message: "اجازه پس گرفتن این موقعیت را ندارید." };
    }
    return { ok: true, status: "draft" };
  }

  if (action === "approve" || action === "publish") {
    if (actor.role !== "admin") {
      return {
        ok: false,
        status: 403,
        message: "فقط مدیر وب‌سایت می‌تواند موقعیت را منتشر کند.",
      };
    }
    if (action === "approve" && position.status !== "pending_review") {
      return {
        ok: false,
        status: 409,
        message: "فقط موقعیت در انتظار تأیید را می‌توان تأیید کرد.",
      };
    }
    if (action === "publish" && position.status === "approved") {
      return { ok: false, status: 409, message: "این موقعیت همین حالا منتشر شده است." };
    }
    if (
      action === "publish" &&
      position.status !== "draft" &&
      position.status !== "rejected" &&
      position.status !== "pending_review"
    ) {
      return { ok: false, status: 409, message: "این موقعیت را نمی‌توان منتشر کرد." };
    }
    return { ok: true, status: "approved" };
  }

  if (action === "reject") {
    if (actor.role !== "admin") {
      return {
        ok: false,
        status: 403,
        message: "فقط مدیر وب‌سایت می‌تواند موقعیت را رد کند.",
      };
    }
    if (position.status !== "pending_review") {
      return {
        ok: false,
        status: 409,
        message: "فقط موقعیت در انتظار تأیید را می‌توان رد کرد.",
      };
    }
    if (!note || note.trim().length < 2) {
      return { ok: false, status: 422, message: "دلیل رد را بنویسید." };
    }
    return { ok: true, status: "rejected" };
  }

  if (actor.role !== "admin") {
    return {
      ok: false,
      status: 403,
      message: "فقط مدیر وب‌سایت می‌تواند موقعیت را از انتشار خارج کند.",
    };
  }
  if (position.status !== "approved") {
    return {
      ok: false,
      status: 409,
      message: "فقط موقعیت منتشر شده را می‌توان از سایت برداشت.",
    };
  }
  return { ok: true, status: "draft" };
}

export type PositionEditorPermissions = {
  canEdit: boolean;
  canSubmit: boolean;
  canWithdraw: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPublish: boolean;
  canUnpublish: boolean;
  canPropose: boolean;
};

export function editorPermissions(
  actor: PositionActor,
  position: PositionAccessRecord | null,
): PositionEditorPermissions {
  if (!canManagePositions(actor.role)) {
    return {
      canEdit: false,
      canSubmit: false,
      canWithdraw: false,
      canApprove: false,
      canReject: false,
      canPublish: false,
      canUnpublish: false,
      canPropose: false,
    };
  }

  if (!position) {
    return {
      canEdit: true,
      canSubmit: true,
      canWithdraw: false,
      canApprove: false,
      canReject: false,
      canPublish: actor.role === "admin",
      canUnpublish: false,
      canPropose: false,
    };
  }

  const probe = (action: PositionAction, note?: string) =>
    transitionPosition(actor, position, action, note).ok;

  return {
    canEdit: canEditPosition(actor, position),
    canSubmit: probe("submit"),
    canWithdraw: probe("withdraw"),
    canApprove: probe("approve"),
    canReject: probe("reject", "نیاز به اصلاح"),
    canPublish: probe("publish"),
    canUnpublish: probe("unpublish"),
    canPropose: canProposePosition(actor, position),
  };
}
