import { z } from "zod";

import {
  isTrustedEmailAddress,
  UNTRUSTED_EMAIL_MESSAGE,
} from "./email-providers";

export const NAME_PATTERN =
  /^[\u0600-\u06FF\u0750-\u077Fa-zA-Z\u200c\u200d .'-]{2,50}$/;

export const contactCategories = [
  "general",
  "urgent",
  "enterprise",
  "car_ride",
  "other",
] as const;

export const sponsorshipDomains = [
  "tech",
  "real_estate",
  "finance",
  "retail",
  "transport",
  "media",
  "other",
] as const;

export const submissionTypes = [
  "contact",
  "driver",
  "career",
  "sponsorship",
] as const;

export const submissionStatuses = [
  "new",
  "in_review",
  "contacted",
  "closed",
] as const;

export type ContactCategory = (typeof contactCategories)[number];
export type SponsorshipDomain = (typeof sponsorshipDomains)[number];
export type SubmissionType = (typeof submissionTypes)[number];
export type SubmissionStatus = (typeof submissionStatuses)[number];

export const contactCategoryLabels: Record<ContactCategory, string> = {
  general: "درخواست عمومی",
  urgent: "درخواست فوری",
  enterprise: "درخواست سازمانی",
  car_ride: "درخواست سفر",
  other: "سایر",
};

export const sponsorshipDomainLabels: Record<SponsorshipDomain, string> = {
  tech: "شرکت فناوری",
  real_estate: "املاک",
  finance: "خدمات مالی",
  retail: "خرده‌فروشی",
  transport: "حمل‌ونقل",
  media: "رسانه و تبلیغات",
  other: "سایر",
};

export const submissionTypeLabels: Record<SubmissionType, string> = {
  contact: "تماس با ما",
  driver: "استخدام راننده",
  career: "فرصت اداری",
  sponsorship: "حمایت و تبلیغات",
};

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
  new: "جدید",
  in_review: "در حال بررسی",
  contacted: "تماس گرفته‌شده",
  closed: "بسته‌شده",
};

export function hasUnsafeMarkup(value: string) {
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) return true;
  if (/[<>]|javascript:|vbscript:|data:text\/html|data:application\/javascript/i.test(value)) {
    return true;
  }
  if (/\bon\w+\s*=/i.test(value)) return true;
  if (/&#|\\x3c|\\u003c|%3c|%3e/i.test(value)) return true;
  return false;
}

export function safeDisplayText(value: unknown, fallback = "—") {
  if (value == null) return fallback;
  const text = String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "");
  const trimmed = text.trim();
  return trimmed || fallback;
}

export function sanitizeSearchQuery(value: string) {
  return value
    .replace(/[%_\\]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 80);
}

export function normalizeIranianMobile(input: string) {
  const digits = input.replace(/[^\d]/g, "");
  let local = digits;
  if (local.startsWith("0098")) local = local.slice(4);
  else if (local.startsWith("98") && local.length >= 12) local = local.slice(2);
  if (local.startsWith("9") && local.length === 10) local = `0${local}`;
  if (!/^09\d{9}$/.test(local)) return null;
  return local;
}

export function toAsciiDigits(input: string) {
  return input
    .replace(/[\u06F0-\u06F9]/g, (digit) =>
      String(digit.charCodeAt(0) - "۰".charCodeAt(0)),
    )
    .replace(/[\u0660-\u0669]/g, (digit) =>
      String(digit.charCodeAt(0) - "٠".charCodeAt(0)),
    );
}

export function isValidIranianNationalId(input: string) {
  const digits = toAsciiDigits(input).replace(/[^\d]/g, "");
  return /^\d{10}$/.test(digits);
}

export const honeypotSchema = z
  .string()
  .max(0, "ارسال نامعتبر است.")
  .optional()
  .or(z.literal(""));

export const idempotencyKeySchema = z
  .string()
  .uuid("شناسه ارسال نامعتبر است.");

export const personNameSchema = z
  .string()
  .trim()
  .min(2, "نام باید حداقل ۲ حرف باشد.")
  .max(30, "نام نباید بیشتر از 30 حرف باشد.")
  .regex(NAME_PATTERN, "فقط حروف فارسی یا انگلیسی مجاز است.")
  .refine((value) => !hasUnsafeMarkup(value), "متن واردشده مجاز نیست.");

export const phoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalized = normalizeIranianMobile(value);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "شماره موبایل معتبر وارد کنید.",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "ایمیل بیش از حد طولانی است.")
  .email("ایمیل معتبر وارد کنید.")
  .refine((value) => !hasUnsafeMarkup(value), "ایمیل نامعتبر است.")
  .refine((value) => isTrustedEmailAddress(value), UNTRUSTED_EMAIL_MESSAGE);

export const longTextSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(20, `${label} باید حداقل ۲۰ حرف باشد.`)
    .max(450, `${label} نباید بیشتر از ۲۰۰۰ حرف باشد.`)
    .refine((value) => !hasUnsafeMarkup(value), "متن واردشده مجاز نیست.");

export const nationalIdSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const digits = toAsciiDigits(value).replace(/[^\d]/g, "");
    if (!isValidIranianNationalId(digits)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "کد ملی باید دقیقاً ۱۰ رقم باشد.",
      });
      return z.NEVER;
    }
    return digits;
  });

export const publicMetaSchema = z.object({
  website: honeypotSchema,
  idempotencyKey: idempotencyKeySchema,
});
