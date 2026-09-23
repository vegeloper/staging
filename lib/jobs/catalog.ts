import type { JobMetaItem, JobSection } from "./types";

export type PositionSeed = {
  slug: string;
  title: string;
  employmentType: string;
  department: string;
  city: string;
  summary: string;
  highlights: string[];
  sections: JobSection[];
  meta: JobMetaItem[];
  sortOrder: number;
};

const department = "تریپ";
const city = "تهران";

const openings: Array<{ slug: string; title: string; employmentType: string }> = [
  { slug: "frontend-developer", title: "توسعه‌دهنده Front-End", employmentType: "تمام وقت" },
  { slug: "backend-developer", title: "توسعه‌دهنده Back-End", employmentType: "تمام وقت" },
  { slug: "product-designer", title: "طراح محصول", employmentType: "تمام وقت" },
  { slug: "product-manager", title: "مدیر محصول", employmentType: "تمام وقت" },
  { slug: "hr-specialist", title: "کارشناس منابع انسانی", employmentType: "تمام وقت" },
  { slug: "customer-support", title: "کارشناس پشتیبانی مشتریان", employmentType: "شیفتی" },
  { slug: "accountant", title: "کارشناس حسابداری", employmentType: "تمام وقت" },
  { slug: "operations-specialist", title: "کارشناس عملیات", employmentType: "تمام وقت" },
  {
    slug: "digital-marketing-specialist",
    title: "کارشناس دیجیتال مارکتینگ",
    employmentType: "تمام وقت",
  },
  { slug: "data-analyst", title: "تحلیلگر داده", employmentType: "تمام وقت" },
  { slug: "devops-engineer", title: "مهندس DevOps", employmentType: "تمام وقت" },
  { slug: "business-development", title: "کارشناس توسعه کسب‌وکار", employmentType: "تمام وقت" },
];

function seedPosition(
  opening: (typeof openings)[number],
  sortOrder: number,
): PositionSeed {
  const summary = `فرصت همکاری به‌عنوان ${opening.title} در تیم ${department}، شهر ${city}. نوع همکاری: ${opening.employmentType}.`;
  return {
    slug: opening.slug,
    title: opening.title,
    employmentType: opening.employmentType,
    department,
    city,
    summary,
    highlights: [
      `همکاری ${opening.employmentType}`,
      `محل فعالیت: ${city}`,
    ],
    sections: [
      {
        title: "هدف شغل:",
        description: `همکاری در نقش ${opening.title} و پیشبرد کار تیم ${department} در دات‌وان تریپ.`,
      },
      {
        title: "شرح وظایف و مسئولیت‌ها:",
        items: [
          `انجام مسئولیت‌های روزانه نقش ${opening.title}`,
          "هماهنگی با تیم‌های مرتبط برای تحویل به‌موقع کار",
        ],
      },
      {
        title: "شرایط:",
        items: [
          "توانایی کار تیمی و پیگیری شفاف",
          "علاقه به فعالیت در یک تیم محصول حمل‌ونقل",
        ],
      },
    ],
    meta: [
      { label: "نوع همکاری", value: opening.employmentType },
      { label: "واحد", value: department },
      { label: "شهر", value: city },
    ],
    sortOrder,
  };
}

export function starterPositions(): PositionSeed[] {
  return openings.map((opening, index) => seedPosition(opening, index));
}
