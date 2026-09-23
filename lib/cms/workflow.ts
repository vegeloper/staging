import type { UserRole } from "@/lib/auth/rbac";

export const contentKinds = ["news", "article"] as const;
export type ContentKind = (typeof contentKinds)[number];

export const contentCategories = ["مقالات", "راهنما", "اطلاعیه", "اخبار"] as const;
export type ContentCategory = (typeof contentCategories)[number];

export const contentStatuses = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export const cmsActions = [
  "submit",
  "withdraw",
  "approve",
  "reject",
  "publish",
  "unpublish",
] as const;
export type CmsAction = (typeof cmsActions)[number];

export const contentKindLabels: Record<ContentKind, string> = {
  news: "خبر",
  article: "مقاله",
};

export const contentStatusLabels: Record<ContentStatus, string> = {
  draft: "پیش‌نویس",
  pending_review: "در انتظار تأیید",
  approved: "منتشر شده",
  rejected: "رد شده",
};

export const cmsActionLabels = {
  save: "ذخیره شد",
  created: "ایجاد شد",
  updated: "ویرایش شد",
  submit: "برای تأیید ارسال شد",
  withdraw: "به پیش‌نویس برگشت",
  approve: "تأیید و منتشر شد",
  publish: "منتشر شد",
  reject: "رد شد",
  unpublish: "از انتشار خارج شد",
} as const;

export type CmsActor = {
  userId: string;
  role: UserRole;
};

export type ContentAccessRecord = {
  authorId: string | null;
  status: ContentStatus;
};

export type TransitionResult =
  | { ok: true; status: ContentStatus }
  | { ok: false; status: 403 | 409 | 422; message: string };

const categoriesByKind: Record<ContentKind, readonly ContentCategory[]> = {
  news: ["اخبار", "اطلاعیه"],
  article: ["مقالات", "راهنما"],
};

export function categoriesForKind(kind: ContentKind) {
  return categoriesByKind[kind];
}

export function categoryMatchesKind(kind: ContentKind, category: ContentCategory) {
  return categoriesByKind[kind].includes(category);
}

export function canViewContent(actor: CmsActor, post: ContentAccessRecord) {
  if (actor.role === "admin") return true;
  if (actor.role !== "content_creator") return false;
  return post.authorId === actor.userId;
}

export function canEditContent(actor: CmsActor, post: ContentAccessRecord) {
  if (!canViewContent(actor, post)) return false;
  if (actor.role === "admin") return true;
  return post.status === "draft" || post.status === "rejected";
}

export function transitionContent(
  actor: CmsActor,
  post: ContentAccessRecord,
  action: CmsAction,
  note?: string,
): TransitionResult {
  if (!canViewContent(actor, post)) {
    return { ok: false, status: 403, message: "به این مطلب دسترسی ندارید." };
  }

  if (action === "submit") {
    if (actor.role !== "admin" && actor.role !== "content_creator") {
      return { ok: false, status: 403, message: "اجازه ارسال مطلب را ندارید." };
    }
    if (post.status !== "draft" && post.status !== "rejected") {
      return {
        ok: false,
        status: 409,
        message: "فقط پیش‌نویس یا مطلب رد شده را می‌توان برای تأیید فرستاد.",
      };
    }
    if (actor.role === "content_creator" && post.authorId !== actor.userId) {
      return { ok: false, status: 403, message: "فقط نویسنده می‌تواند این مطلب را بفرستد." };
    }
    return { ok: true, status: "pending_review" };
  }

  if (action === "withdraw") {
    if (post.status !== "pending_review") {
      return {
        ok: false,
        status: 409,
        message: "فقط مطلب در انتظار تأیید را می‌توان پس گرفت.",
      };
    }
    if (actor.role !== "admin" && post.authorId !== actor.userId) {
      return { ok: false, status: 403, message: "اجازه پس گرفتن این مطلب را ندارید." };
    }
    return { ok: true, status: "draft" };
  }

  if (action === "approve" || action === "publish") {
    if (actor.role !== "admin") {
      return {
        ok: false,
        status: 403,
        message: "فقط مدیر وب‌سایت می‌تواند مطلب را منتشر کند.",
      };
    }
    if (action === "approve" && post.status !== "pending_review") {
      return {
        ok: false,
        status: 409,
        message: "فقط مطلب در انتظار تأیید را می‌توان تأیید کرد.",
      };
    }
    if (action === "publish" && post.status === "approved") {
      return { ok: false, status: 409, message: "این مطلب همین حالا منتشر شده است." };
    }
    if (
      action === "publish" &&
      post.status !== "draft" &&
      post.status !== "rejected" &&
      post.status !== "pending_review"
    ) {
      return { ok: false, status: 409, message: "این مطلب را نمی‌توان منتشر کرد." };
    }
    return { ok: true, status: "approved" };
  }

  if (action === "reject") {
    if (actor.role !== "admin") {
      return {
        ok: false,
        status: 403,
        message: "فقط مدیر وب‌سایت می‌تواند مطلب را رد کند.",
      };
    }
    if (post.status !== "pending_review") {
      return {
        ok: false,
        status: 409,
        message: "فقط مطلب در انتظار تأیید را می‌توان رد کرد.",
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
      message: "فقط مدیر وب‌سایت می‌تواند مطلب را از انتشار خارج کند.",
    };
  }
  if (post.status !== "approved") {
    return {
      ok: false,
      status: 409,
      message: "فقط مطلب منتشر شده را می‌توان از سایت برداشت.",
    };
  }
  return { ok: true, status: "draft" };
}

export type EditorPermissions = {
  canEdit: boolean;
  canSubmit: boolean;
  canWithdraw: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPublish: boolean;
  canUnpublish: boolean;
};

export function editorPermissions(
  actor: CmsActor,
  post: ContentAccessRecord | null,
): EditorPermissions {
  if (actor.role !== "admin" && actor.role !== "content_creator") {
    return {
      canEdit: false,
      canSubmit: false,
      canWithdraw: false,
      canApprove: false,
      canReject: false,
      canPublish: false,
      canUnpublish: false,
    };
  }

  if (!post) {
    return {
      canEdit: true,
      canSubmit: actor.role === "content_creator" || actor.role === "admin",
      canWithdraw: false,
      canApprove: false,
      canReject: false,
      canPublish: actor.role === "admin",
      canUnpublish: false,
    };
  }

  const probe = (action: CmsAction, note?: string) =>
    transitionContent(actor, post, action, note).ok;

  return {
    canEdit: canEditContent(actor, post),
    canSubmit: probe("submit"),
    canWithdraw: probe("withdraw"),
    canApprove: probe("approve"),
    canReject: probe("reject", "نیاز به اصلاح"),
    canPublish: probe("publish"),
    canUnpublish: probe("unpublish"),
  };
}

export function actionLabel(action: string) {
  if (Object.hasOwn(cmsActionLabels, action)) {
    return cmsActionLabels[action as keyof typeof cmsActionLabels];
  }
  return action;
}
