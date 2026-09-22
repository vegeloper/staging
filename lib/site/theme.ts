import { z } from "zod";

import type { SiteTheme } from "./defaults";

const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "رنگ باید به شکل #rrggbb باشد.");

export function isSafeAssetPath(value: string) {
  if (!value) return true;
  if (value.length > 240) return false;
  if (value.includes("..")) return false;
  if (/[\s"'`()<>\\;{}]/.test(value)) return false;
  return /^\/(?:figma|videos|fonts|uploads)\/[A-Za-z0-9_./-]+$/.test(value);
}

const assetPath = z.string().trim().refine(isSafeAssetPath, {
  message: "مسیر باید داخل /figma، /videos، /fonts یا /uploads باشد.",
});

export const themeSchema = z.object({
  colors: z.object({
    brand: hex,
    brandDark: hex,
    ink: hex,
    paper: hex,
    surface: hex,
    hero: hex,
  }),
  background: z.object({
    image: assetPath,
  }),
  media: z.object({
    logo: assetPath,
    logoFooter: assetPath,
    footerLogo: assetPath,
    heroImage: assetPath,
    campaignVideo: assetPath,
    campaignPoster: assetPath,
  }),
});

export const copyrightSchema = z.object({
  text: z
    .string()
    .trim()
    .min(2, "متن کپی‌رایت خیلی کوتاه است.")
    .max(400, "متن کپی‌رایت حداکثر ۴۰۰ نویسه است.")
    .refine((value) => !/[<>]/.test(value), "متن کپی‌رایت نباید برچسب HTML داشته باشد."),
});

export type CopyrightDocument = z.infer<typeof copyrightSchema>;

export function parseTheme(input: unknown) {
  return themeSchema.safeParse(input) as z.SafeParseReturnType<unknown, SiteTheme>;
}

export function parseCopyright(input: unknown) {
  return copyrightSchema.safeParse(input);
}
