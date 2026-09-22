import Link from "next/link";
import { notFound } from "next/navigation";

import StatusActions from "@/components/admin/StatusActions";
import styles from "@/components/admin/Admin.module.css";
import {
  contactCategoryLabels,
  safeDisplayText,
  sponsorshipDomainLabels,
  submissionStatusLabels,
  submissionTypeLabels,
} from "@/lib/forms";
import { requireInboxUser } from "@/lib/auth";
import { getSubmissionDetail } from "@/lib/submissions/service";

export const dynamic = "force-dynamic";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireInboxUser();
  const item = await getSubmissionDetail(id);
  if (!item || !item.detail) notFound();

  const detail = item.detail as Record<string, unknown>;

  return (
    <>
      <Link href="/admin" className={styles.backButton}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 5l7 7-7 7M21 12H3"
          />
        </svg>
        بازگشت به فهرست درخواست‌ها
      </Link>
      <h1>{submissionTypeLabels[item.type]}</h1>
      <p>
        وضعیت فعلی: {submissionStatusLabels[item.status]} ·{" "}
        {item.createdAt.toLocaleString("fa-IR")}
      </p>
      <StatusActions id={item.id} status={item.status} />
      <dl className={styles.detailGrid}>
        {item.type === "contact" ? (
          <>
            <Item label="نام" value={`${detail.firstName} ${detail.lastName}`} />
            <Item label="موبایل" value={String(detail.phone)} />
            <Item label="ایمیل" value={String(detail.email)} />
            <Item
              label="دسته‌بندی"
              value={contactCategoryLabels[detail.category as keyof typeof contactCategoryLabels]}
            />
            <Item label="پیام" value={String(detail.message)} />
          </>
        ) : null}
        {item.type === "driver" ? (
          <>
            <Item label="نام" value={`${detail.firstName} ${detail.lastName}`} />
            <Item label="موبایل" value={String(detail.phone)} />
            <Item label="کد ملی" value={String(detail.nationalId ?? "—")} />
            <Item label="استان" value={String(detail.province)} />
            <Item label="شهر" value={String(detail.city)} />
            <Item label="آدرس" value={String(detail.address)} />
            <Item label="توضیحات" value={String(detail.description)} />
          </>
        ) : null}
        {item.type === "career" ? (
          <>
            <Item label="نام" value={`${detail.firstName} ${detail.lastName}`} />
            <Item label="موبایل" value={String(detail.phone)} />
            <Item label="ایمیل" value={String(detail.email)} />
            <Item label="نام فایل" value={safeDisplayText(detail.resumeOriginalName)} />
            <div>
              <dt>رزومه</dt>
              <dd>
                <a href={`/api/admin/submissions/${item.id}/resume`}>دانلود فایل</a>
              </dd>
            </div>
          </>
        ) : null}
        {item.type === "sponsorship" ? (
          <>
            <Item label="نام مسئول" value={String(detail.fullName)} />
            <Item label="موبایل" value={String(detail.phone)} />
            <Item label="برند" value={String(detail.brandName)} />
            <Item
              label="حوزه فعالیت"
              value={
                sponsorshipDomainLabels[
                  detail.activityDomain as keyof typeof sponsorshipDomainLabels
                ]
              }
            />
          </>
        ) : null}
      </dl>
    </>
  );
}

function Item({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{safeDisplayText(value)}</dd>
    </div>
  );
}
