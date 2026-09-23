"use client";

import { useRef, useState } from "react";

import DriverHiringCard, {
  type DriverHiringCardProps,
} from "../join-us/DriverHiringCard/DriverHiringCard";

import CorporateJobCard, {
  type CorporateJobCardProps,
} from "../join-us/CorporateJobCard/CorporateJobCard";

import Pagination from "../Pagination/Pagination";

import styles from "./Positions.module.css";

type DriverPositionsProps = {
  type: "driver";
  title: string;
  subtitle?: string;
  jobs: DriverHiringCardProps[];
  itemsPerPage?: number;
};

type CorporatePositionsProps = {
  type: "corporate";
  title: string;
  subtitle?: string;
  jobs: CorporateJobCardProps[];
  itemsPerPage?: number;
};

type PositionsProps = DriverPositionsProps | CorporatePositionsProps;

export default function Positions(props: PositionsProps) {
  const { title, subtitle, itemsPerPage = 20 } = props;

  const [currentPage, setCurrentPage] = useState(1);

  const sectionRef = useRef<HTMLElement>(null);

  const hasJobs = props.jobs.length > 0;

  const totalPages = Math.ceil(
    props.jobs.length / itemsPerPage,
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const endIndex =
    startIndex + itemsPerPage;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      dir="rtl"
    >
      {/* Heading */}
      <div className={styles.heading}>
        <h1 className={styles.title}>
          {title}
        </h1>

        {subtitle && (
          <p className={styles.subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Empty State */}
      {!hasJobs && (
        <div className={styles.emptyWrapper}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <img
                src="/figma/svgs/building.svg"
                alt=""
                aria-hidden="true"
              />
            </div>

            <div className={styles.emptyContent}>
              <div className={styles.emptyBadge}>
                <span
                  className={styles.emptyBadgeDot}
                />

                فرصت‌های همکاری
              </div>

              <h2 className={styles.emptyTitle}>
                در حال حاضر موقعیت فعالی وجود ندارد
              </h2>

              <p className={styles.emptyDescription}>
                در حال حاضر فرصت همکاری فعالی برای
                نمایش وجود ندارد. موقعیت‌های جدید
                به‌زودی در همین صفحه منتشر خواهند شد.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Driver Positions */}
      {hasJobs && props.type === "driver" && (
        <div className={styles.grid}>
          {props.jobs
            .slice(startIndex, endIndex)
            .map((job) => (
              <DriverHiringCard
                key={job.id}
                {...job}
              />
            ))}
        </div>
      )}

      {/* Corporate Positions */}
      {hasJobs && props.type === "corporate" && (
        <div className={styles.grid}>
          {props.jobs
            .slice(startIndex, endIndex)
            .map((job) => (
              <CorporateJobCard
                key={job.id}
                {...job}
              />
            ))}
        </div>
      )}

      {/* Pagination */}
      {hasJobs && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </section>
  );
}