import Link from "next/link";

import DriverHiringCard, {
  type DriverHiringCardProps,
} from "../DriverHiringCard/DriverHiringCard";

import styles from "./DriverHiringSection.module.css";

type DriverHiringSectionProps = {
  title: string;
  subtitle?: string;
  jobs: DriverHiringCardProps[];
  showAllText?: string;
  showAllHref?: string;
};

export default function DriverHiringSection({
  title,
  subtitle,
  jobs,
  showAllText = "مشاهده همه",
  showAllHref = "/hiring",
}: DriverHiringSectionProps) {
  const hasJobs = jobs.length > 0;

  return (
    <section className={styles.section} dir="rtl">
      <div className={styles.heading}>
        <h2 className={styles.title}>{title}</h2>

        {subtitle && (
          <p className={styles.subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      {hasJobs ? (
        <>
          <div className={styles.grid}>
            {jobs.slice(0, 4).map((job) => (
              <DriverHiringCard
                key={job.id}
                {...job}
              />
            ))}
          </div>

          <Link
            href={showAllHref}
            className={styles.showAllButton}
          >
            {showAllText}
          </Link>
        </>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <img
              src="/figma/svgs/building.svg"
              alt=""
              aria-hidden="true"
            />
          </div>

          <span className={styles.emptyBadge}>
            <span className={styles.emptyBadgeDot} />
            فرصت‌های همکاری
          </span>

          <h3 className={styles.emptyTitle}>
            در حال حاضر موقعیت فعالی وجود ندارد
          </h3>

          <p className={styles.emptyDescription}>
            در حال حاضر فرصت همکاری فعالی برای رانندگان
            وجود ندارد. موقعیت‌های جدید به‌زودی در همین
            بخش منتشر خواهند شد.
          </p>
        </div>
      )}
    </section>
  );
}