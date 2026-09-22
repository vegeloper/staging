import { z } from "zod";

import { parseBody } from "./body";
import { isAllowedContentImage } from "./images";
import {
  categoryMatchesKind,
  contentCategories,
  contentKinds,
  type ContentCategory,
  type ContentKind,
} from "./workflow";

export const contentFormSchema = z
  .object({
    kind: z.enum(contentKinds),
    category: z.enum(contentCategories),
    title: z.string().trim().min(3, "عنوان خیلی کوتاه است.").max(180),
    slug: z
      .string()
      .trim()
      .min(2, "نشانی را وارد کنید.")
      .max(80)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "نشانی فقط می‌تواند حروف کوچک انگلیسی، عدد و خط تیره داشته باشد.",
      ),
    displayDate: z.string().trim().min(1, "تاریخ نمایش را وارد کنید.").max(40),
    commentsLabel: z.string().trim().min(1).max(20).default("۰"),
    likesLabel: z.string().trim().min(1).max(20).default("۰"),
    imageSrc: z
      .string()
      .refine(isAllowedContentImage, "تصویر نامعتبر است."),
    imageAlt: z.string().trim().min(2, "توضیح تصویر را بنویسید.").max(180),
    imageObjectPosition: z.string().trim().max(40).default(""),
    bodyText: z.string().trim().min(1, "متن مطلب را بنویسید.").max(20_000),
    featured: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (!categoryMatchesKind(value.kind, value.category)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["category"],
        message: "این دسته با نوع مطلب هم‌خوان نیست.",
      });
    }

    const blocks = parseBody(value.bodyText);
    if (blocks.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bodyText"],
        message: "متن مطلب را بنویسید.",
      });
    }
    if (blocks.length > 80) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bodyText"],
        message: "متن مطلب بیش از حد بخش‌بندی شده است.",
      });
    }
    if (blocks.some((block) => block.text.length > 2000)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bodyText"],
        message: "یکی از بندها بیش از حد طولانی است.",
      });
    }
  });

export type ContentFormInput = z.infer<typeof contentFormSchema>;

export type ContentFormValues = {
  kind: ContentKind;
  category: ContentCategory;
  title: string;
  slug: string;
  displayDate: string;
  commentsLabel: string;
  likesLabel: string;
  imageSrc: string;
  imageAlt: string;
  imageObjectPosition: string;
  bodyText: string;
  featured: boolean;
};

export const emptyContentForm: ContentFormValues = {
  kind: "article",
  category: "مقالات",
  title: "",
  slug: "",
  displayDate: "",
  commentsLabel: "۰",
  likesLabel: "۰",
  imageSrc: "/figma/png/passenger-insideCar.jpg",
  imageAlt: "",
  imageObjectPosition: "",
  bodyText: "",
  featured: false,
};
