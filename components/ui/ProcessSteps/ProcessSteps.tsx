import Image from "next/image";

import styles from "./ProcessSteps.module.css";
import Link from "next/link";

export type ProcessStep = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

type ProcessStepsProps = {
  title?: string;
  description?: string;
  steps?: ProcessStep[];
  ctaLabel?: string;
  ctaHref?: string;
};

const defaultSteps: ProcessStep[] = [
  {
    id: "needs",
    title: "نیازسنجی سازمان",
    description:
      "نیازهای سازمان، تعداد کاربران، مسیرها، زمان‌بندی و نوع سرویس بررسی می‌شود.",
    icon: "/figma/svgs/small-icons/checklist.svg",
  },
  {
    id: "model",
    title: "طراحی مدل سرویس",
    description: "مدل مناسب حمل‌ونقل بر اساس نیازهای شناسایی‌شده پیشنهاد می‌شود.",
    icon: "/figma/svgs/small-icons/bulb.svg",
  },
  {
    id: "details",
    title: "نهایی‌سازی جزئیات",
    description:
      "جزئیات سرویس، نحوه اجرا و چارچوب همکاری مشخص می‌شود.",
    icon: "/figma/svgs/small-icons/shakeHands.svg",
  },
  {
    id: "launch",
    title: "راه‌اندازی سرویس",
    description: "پس از نهایی شدن هماهنگی‌ها، اجرای سرویس سازمانی آغاز می‌شود.",
    icon: "/figma/svgs/small-icons/shuttel.svg",
  },
  {
    id: "optimize",
    title: "پایش و بهینه‌سازی",
    description:
      "عملکرد سرویس بررسی می‌شود تا در صورت نیاز، برنامه حمل‌ونقل بهینه شود.",
    icon: "/figma/svgs/small-icons/refresh.svg",
  },
];

export default function ProcessSteps({
  title = "فرآیند شروع همکاری سازمانی",
  description,
  steps = defaultSteps,
  ctaLabel = "درخواست مشاوره",
  ctaHref = "#",
}: ProcessStepsProps) {
  const topSteps = steps.slice(0, 3);
  const bottomSteps = steps.slice(3);

  return (
    <section className={styles.section} dir="rtl">
      <div className={styles.shell}>
        {(title || description) && (
          <div className={styles.intro}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {description && <p className={styles.lead}>{description}</p>}
          </div>
        )}

        <div className={styles.topRow}>
          {topSteps.map((step) => (
            <StepItem key={step.id} step={step} />
          ))}
        </div>

        {bottomSteps.length > 0 && (
          <div className={styles.bottomRow}>
            {bottomSteps.map((step) => (
              <StepItem key={step.id} step={step} />
            ))}
          </div>
        )}

        {ctaLabel && (
          <div className={styles.ctaWrap}>
            <Link  className={styles.cta} href={ctaHref}>
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function StepItem({ step }: { step: ProcessStep }) {
  return (
    <article className={styles.step}>
      <span className={styles.iconBox} aria-hidden="true">
        <Image
          src={step.icon}
          alt=""
          width={22}
          height={22}
          unoptimized
          className={styles.icon}
        />
      </span>
      <div className={styles.stepCopy}>
        <h3 className={styles.stepTitle}>{step.title}</h3>
        <p className={styles.stepText}>{step.description}</p>
      </div>
    </article>
  );
}
