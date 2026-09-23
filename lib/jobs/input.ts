import { z } from "zod";

import { employmentTypes, type EmploymentType } from "./workflow";
import type { JobMetaItem, JobSection } from "./types";

const lineLimit = 200;

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseMetaText(value: string): JobMetaItem[] {
  return lines(value).flatMap((line) => {
    const splitAt = line.indexOf("|");
    if (splitAt <= 0) return [];
    const label = line.slice(0, splitAt).trim();
    const itemValue = line.slice(splitAt + 1).trim();
    if (!label || !itemValue) return [];
    return [{ label, value: itemValue }];
  });
}

export function buildSections(input: {
  goalText: string;
  responsibilitiesText: string;
  requirementsText: string;
}): JobSection[] {
  const sections: JobSection[] = [];
  const goal = input.goalText.trim();
  if (goal) sections.push({ title: "هدف شغل:", description: goal });
  const responsibilities = lines(input.responsibilitiesText);
  if (responsibilities.length > 0) {
    sections.push({ title: "شرح وظایف و مسئولیت‌ها:", items: responsibilities });
  }
  const requirements = lines(input.requirementsText);
  if (requirements.length > 0) {
    sections.push({ title: "شرایط:", items: requirements });
  }
  return sections;
}

function knownSection(title: string) {
  return (
    title === "هدف شغل:" ||
    title === "شرح وظایف و مسئولیت‌ها:" ||
    title === "شرایط:"
  );
}

export function positionToForm(position: {
  title: string;
  slug: string;
  employmentType: string;
  department: string;
  city: string;
  summary: string;
  highlights: string[];
  sections: JobSection[];
  meta: JobMetaItem[];
  sortOrder: number;
}): PositionFormValues {
  const goal = position.sections.find((section) => section.title === "هدف شغل:");
  const responsibilities = position.sections.find(
    (section) => section.title === "شرح وظایف و مسئولیت‌ها:",
  );
  const requirements = position.sections.find((section) => section.title === "شرایط:");
  const extras = position.sections
    .filter((section) => !knownSection(section.title))
    .flatMap((section) => [
      section.title,
      section.description ?? "",
      ...(section.items ?? []),
    ])
    .map((line) => line.trim())
    .filter(Boolean);

  const employmentType = employmentTypes.includes(position.employmentType as EmploymentType)
    ? (position.employmentType as EmploymentType)
    : "تمام وقت";

  return {
    title: position.title,
    slug: position.slug,
    employmentType,
    department: position.department,
    city: position.city,
    summary: position.summary,
    highlightsText: position.highlights.join("\n"),
    goalText: goal?.description ?? "",
    responsibilitiesText: (responsibilities?.items ?? []).join("\n"),
    requirementsText: [...(requirements?.items ?? []), ...extras].join("\n"),
    metaText: position.meta.map((item) => `${item.label} | ${item.value}`).join("\n"),
    sortOrder: position.sortOrder,
  };
}

function checkLines(
  value: string,
  path: string,
  maxLines: number,
  ctx: z.RefinementCtx,
) {
  const parsed = lines(value);
  if (parsed.length > maxLines) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: `بیش از ${maxLines.toLocaleString("fa-IR")} خط مجاز نیست.`,
    });
  }
  if (parsed.some((line) => line.length > lineLimit)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: "یکی از خط‌ها بیش از حد طولانی است.",
    });
  }
}

export const positionFormSchema = z
  .object({
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
    employmentType: z.enum(employmentTypes),
    department: z.string().trim().min(1, "واحد را وارد کنید.").max(80),
    city: z.string().trim().min(1, "شهر را وارد کنید.").max(80),
    summary: z.string().trim().min(10, "خلاصه موقعیت را بنویسید.").max(600),
    highlightsText: z.string().trim().max(4000).default(""),
    goalText: z.string().trim().max(2000).default(""),
    responsibilitiesText: z.string().trim().max(8000).default(""),
    requirementsText: z.string().trim().max(8000).default(""),
    metaText: z.string().trim().max(4000).default(""),
    sortOrder: z.number().int().min(0).max(9999).default(0),
  })
  .superRefine((value, ctx) => {
    checkLines(value.highlightsText, "highlightsText", 12, ctx);
    checkLines(value.responsibilitiesText, "responsibilitiesText", 30, ctx);
    checkLines(value.requirementsText, "requirementsText", 30, ctx);
    const meta = parseMetaText(value.metaText);
    const metaLines = lines(value.metaText);
    if (metaLines.length !== meta.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["metaText"],
        message: "هر مشخصه را به شکل «برچسب | مقدار» بنویسید.",
      });
    }
    if (meta.length > 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["metaText"],
        message: "بیش از ۱۲ مشخصه مجاز نیست.",
      });
    }
  });

export type PositionFormInput = z.infer<typeof positionFormSchema>;

export type PositionFormValues = {
  title: string;
  slug: string;
  employmentType: EmploymentType;
  department: string;
  city: string;
  summary: string;
  highlightsText: string;
  goalText: string;
  responsibilitiesText: string;
  requirementsText: string;
  metaText: string;
  sortOrder: number;
};

export const emptyPositionForm: PositionFormValues = {
  title: "",
  slug: "",
  employmentType: "تمام وقت",
  department: "تریپ",
  city: "تهران",
  summary: "",
  highlightsText: "",
  goalText: "",
  responsibilitiesText: "",
  requirementsText: "",
  metaText: "",
  sortOrder: 0,
};

export function positionFields(input: PositionFormInput) {
  return {
    desiredSlug: input.slug,
    title: input.title,
    employmentType: input.employmentType,
    department: input.department,
    city: input.city,
    summary: input.summary,
    highlights: lines(input.highlightsText),
    sections: buildSections(input),
    meta: parseMetaText(input.metaText),
    sortOrder: input.sortOrder,
    updatedAt: new Date(),
  };
}
