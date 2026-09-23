export type CorporateJobLocation = {
  label: string;
  icon: string;
};

export type CorporateJobMeta = {
  label: string;
  value: string;
};

export type CorporateJobSection = {
  title: string;
  description?: string;
  items?: string[];
};

export type CorporateJob = {
  id: string;

  title: string;

  employmentType: string;

  locations: CorporateJobLocation[];

  highlights?: string[];

  sections: CorporateJobSection[];

  meta?: CorporateJobMeta[];
};

/* ========================================
   Corporate Jobs
======================================== */

export const corporateJobs: CorporateJob[] = [
  {
    id: "frontend-developer",

    title: "توسعه‌دهنده Front-End",

    employmentType: "تمام وقت",

    locations: [
      {
        label: "تریپ",
        icon: "/figma/svgs/building.svg",
      },
      {
        label: "تهران",
        icon: "/figma/svgs/location.svg",
      },
    ],

    highlights: [
      "۳ سال سابقه کار در گروه شغلی مشابه",
      "کارشناسی مهندسی نرم‌افزار، کامپیوتر یا رشته‌های مرتبط",
    ],

    sections: [
      {
        title: "هدف شغل:",
        description:
          "توسعه و نگهداری رابط‌های کاربری محصولات دات‌وان تریپ با تمرکز بر کیفیت، عملکرد، تجربه کاربری و توسعه‌پذیری.",
      },

      {
        title: "شرح وظایف و مسئولیت‌ها:",
        items: [
          "توسعه و نگهداری رابط‌های کاربری وب",
          "پیاده‌سازی دقیق طراحی‌های UI/UX",
          "همکاری با تیم‌های Back-End، محصول و طراحی",
          "بهینه‌سازی عملکرد و سرعت صفحات",
          "توسعه کامپوننت‌های قابل استفاده مجدد",
          "رفع باگ‌ها و بهبود مستمر کدهای موجود",
        ],
      },

      {
        title: "مهارت‌های موردنیاز:",
        items: [
          "تسلط به JavaScript و TypeScript",
          "تسلط به React و Next.js",
          "تسلط به HTML و CSS",
          "آشنایی با Responsive Design",
          "آشنایی با Git",
          "آشنایی با REST API",
        ],
      },
    ],

    meta: [
      {
        label: "نوع همکاری",
        value: "تمام وقت",
      },
      {
        label: "محل کار",
        value: "تهران",
      },
      {
        label: "تحصیلات",
        value: "کارشناسی مهندسی نرم‌افزار یا رشته‌های مرتبط",
      },
      {
        label: "سابقه کار",
        value: "حداقل ۳ سال",
      },
    ],
  },

  {
    id: "backend-developer",

    title: "توسعه‌دهنده Back-End",

    employmentType: "تمام وقت",

    locations: [
      {
        label: "تریپ",
        icon: "/figma/svgs/building.svg",
      },
      {
        label: "تهران",
        icon: "/figma/svgs/location.svg",
      },
    ],

    highlights: [
      "۳ سال سابقه کار مرتبط",
      "تجربه توسعه سرویس‌های مقیاس‌پذیر",
    ],

    sections: [
      {
        title: "هدف شغل:",
        description:
          "توسعه و نگهداری سرویس‌های سمت سرور و زیرساخت‌های نرم‌افزاری موردنیاز محصولات دات‌وان تریپ.",
      },

      {
        title: "شرح وظایف و مسئولیت‌ها:",
        items: [
          "طراحی و توسعه APIها و سرویس‌های Back-End",
          "طراحی و مدیریت ساختار پایگاه داده",
          "بهینه‌سازی عملکرد سرویس‌ها",
          "رفع مشکلات و باگ‌های سمت سرور",
          "همکاری با تیم Front-End و محصول",
          "مشارکت در طراحی معماری نرم‌افزار",
        ],
      },

      {
        title: "مهارت‌های موردنیاز:",
        items: [
          "تسلط به توسعه Back-End",
          "آشنایی با طراحی REST API",
          "تسلط به پایگاه داده‌های SQL یا NoSQL",
          "آشنایی با Git",
          "آشنایی با معماری نرم‌افزار",
        ],
      },
    ],

    meta: [
      {
        label: "نوع همکاری",
        value: "تمام وقت",
      },
      {
        label: "محل کار",
        value: "تهران",
      },
      {
        label: "سابقه کار",
        value: "حداقل ۳ سال",
      },
    ],
  },

  {
    id: "product-designer",

    title: "طراح محصول",

    employmentType: "تمام وقت",

    locations: [
      {
        label: "تریپ",
        icon: "/figma/svgs/building.svg",
      },
      {
        label: "تهران",
        icon: "/figma/svgs/location.svg",
      },
    ],

    highlights: [
      "تجربه طراحی محصولات دیجیتال",
      "تسلط به اصول UI و UX",
    ],

    sections: [
      {
        title: "هدف شغل:",
        description:
          "طراحی تجربه و رابط کاربری محصولات دات‌وان تریپ با تمرکز بر نیازهای کاربران و اهداف کسب‌وکار.",
      },

      {
        title: "شرح وظایف و مسئولیت‌ها:",
        items: [
          "طراحی رابط و تجربه کاربری محصولات",
          "طراحی Wireframe و Prototype",
          "همکاری با تیم محصول و توسعه",
          "تحلیل رفتار و نیاز کاربران",
          "توسعه و نگهداری Design System",
        ],
      },

      {
        title: "مهارت‌های موردنیاز:",
        items: [
          "تسلط به Figma",
          "آشنایی کامل با اصول UI/UX",
          "توانایی طراحی Responsive",
          "توانایی ساخت Prototype",
          "آشنایی با Design System",
        ],
      },
    ],

    meta: [
      {
        label: "نوع همکاری",
        value: "تمام وقت",
      },
      {
        label: "محل کار",
        value: "تهران",
      },
    ],
  },

  {
    id: "data-analyst",

    title: "تحلیلگر داده",

    employmentType: "تمام وقت",

    locations: [
      {
        label: "تریپ",
        icon: "/figma/svgs/building.svg",
      },
      {
        label: "تهران",
        icon: "/figma/svgs/location.svg",
      },
    ],

    highlights: [
      "تجربه تحلیل داده",
      "توانایی تهیه گزارش و داشبورد",
    ],

    sections: [
      {
        title: "هدف شغل:",
        description:
          "تحلیل داده‌های کسب‌وکار و تبدیل آن‌ها به اطلاعات قابل استفاده برای تصمیم‌گیری.",
      },

      {
        title: "شرح وظایف و مسئولیت‌ها:",
        items: [
          "جمع‌آوری و تحلیل داده‌ها",
          "طراحی گزارش‌ها و داشبوردها",
          "شناسایی الگوهای داده",
          "همکاری با تیم‌های محصول و کسب‌وکار",
          "ارائه تحلیل برای تصمیم‌گیری مدیریتی",
        ],
      },
    ],

    meta: [
      {
        label: "نوع همکاری",
        value: "تمام وقت",
      },
      {
        label: "محل کار",
        value: "تهران",
      },
    ],
  },

  {
    id: "devops-engineer",

    title: "مهندس DevOps",

    employmentType: "تمام وقت",

    locations: [
      {
        label: "تریپ",
        icon: "/figma/svgs/building.svg",
      },
      {
        label: "تهران",
        icon: "/figma/svgs/location.svg",
      },
    ],

    highlights: [
      "تجربه مدیریت زیرساخت‌های Production",
      "آشنایی با CI/CD و Containerization",
    ],

    sections: [
      {
        title: "هدف شغل:",
        description:
          "توسعه، نگهداری و پایدارسازی زیرساخت‌های نرم‌افزاری و فرآیندهای استقرار سرویس‌ها.",
      },

      {
        title: "شرح وظایف و مسئولیت‌ها:",
        items: [
          "طراحی و نگهداری CI/CD Pipeline",
          "مدیریت زیرساخت‌های Production",
          "مانیتورینگ سرویس‌ها و زیرساخت",
          "مدیریت Docker و Containerها",
          "بهبود Availability و Reliability سرویس‌ها",
          "اتوماسیون فرآیندهای عملیاتی",
        ],
      },

      {
        title: "مهارت‌های موردنیاز:",
        items: [
          "Linux",
          "Docker",
          "CI/CD",
          "Git",
          "Monitoring",
          "آشنایی با Kubernetes",
        ],
      },
    ],

    meta: [
      {
        label: "نوع همکاری",
        value: "تمام وقت",
      },
      {
        label: "محل کار",
        value: "تهران",
      },
      {
        label: "سابقه کار",
        value: "حداقل ۳ سال",
      },
    ],
  },

 
];


/* ========================================
   Helpers
======================================== */

export function getCorporateJob(id: string) {
  return corporateJobs.find((job) => job.id === id);
}

export function getCorporateJobCards() {
  return corporateJobs.map((job) => ({
    id: job.id,

    title: job.title,

    employmentType: job.employmentType,

    locations: job.locations,
  }));
}