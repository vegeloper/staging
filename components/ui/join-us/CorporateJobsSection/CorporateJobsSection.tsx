import Link from "next/link";

import CorporateJobCard, {
  type CorporateJobCardProps,
} from "../CorporateJobCard/CorporateJobCard";

import styles from "./CorporateJobsSection.module.css";

type CorporateJobsSectionProps = {
  title: string;
  subtitle?: string;
  jobs: CorporateJobCardProps[];
  showAllText?: string;
  showAllHref?: string;
};

export default function CorporateJobsSection({
  title,
  subtitle,
  jobs,
  showAllText = "مشاهده فرصت‌های شغلی",
  showAllHref = "/jobs",
}: CorporateJobsSectionProps) {
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
              <CorporateJobCard
                key={job.id}
                {...job}
              />
            ))}
          </div>

          <Link
            href={showAllHref}
            className={styles.showAllLink}
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
            فرصت‌های شغلی
          </span>

          <h3 className={styles.emptyTitle}>
            در حال حاضر موقعیت شغلی فعالی نداریم
          </h3>

          <p className={styles.emptyDescription}>
            موقعیت‌های شغلی جدید دات‌وان تریپ پس از
            انتشار در همین بخش نمایش داده خواهند شد.
          </p>
        </div>
      )}
    </section>
  );
}