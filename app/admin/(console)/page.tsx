import Link from "next/link";

import styles from "@/components/admin/Admin.module.css";
import { requireAdminUser } from "@/lib/auth";
import { adminOverviewCounts } from "@/lib/site/store";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireAdminUser("/admin");

  let overview: Awaited<ReturnType<typeof adminOverviewCounts>> | null = null;
  try {
    overview = await adminOverviewCounts();
  } catch (error) {
    console.error(error);
  }

  return (
    <>
      <h1>پیشخوان مدیریت</h1>
      <p className={styles.meta}>
        مدیر وب‌سایت درخواست‌ها را رسیدگی می‌کند، موقعیت شغلی را مستقیم منتشر می‌کند، مطلب می‌سازد، رسانه را مدیریت می‌کند، و پوسته و کپی‌رایت را تغییر می‌دهد.
      </p>
      {overview ? (
        <div className={styles.cards}>
          <Link className={styles.cardLink} href="/admin/submissions?status=new">
            <span>صندوق درخواست‌ها</span>
            <strong>{overview.newSubmissions.toLocaleString("fa-IR")}</strong>
            <small>درخواست جدید</small>
          </Link>
          <Link className={styles.cardLink} href="/admin/positions?status=pending_review">
            <span>موقعیت‌های شغلی</span>
            <strong>{overview.pendingPositions.toLocaleString("fa-IR")}</strong>
            <small>در انتظار تأیید</small>
          </Link>
          <Link className={styles.cardLink} href="/admin/content?status=pending_review">
            <span>مطالب و اخبار</span>
            <strong>{overview.pendingContent.toLocaleString("fa-IR")}</strong>
            <small>در انتظار تأیید</small>
          </Link>
          <Link className={styles.cardLink} href="/admin/media">
            <span>کتابخانه رسانه</span>
            <strong>{overview.mediaCount.toLocaleString("fa-IR")}</strong>
            <small>فایل تأییدشده</small>
          </Link>
          <Link className={styles.cardLink} href="/admin/theme">
            <span>پوسته و رنگ‌ها</span>
            <strong>{overview.themeRevision.toLocaleString("fa-IR")}</strong>
            <small>نسخه منتشرشده پوسته</small>
          </Link>
          <Link className={styles.cardLink} href="/admin/copyright">
            <span>متن کپی‌رایت</span>
            <strong>{overview.copyrightRevision.toLocaleString("fa-IR")}</strong>
            <small>{overview.copyright}</small>
          </Link>
        </div>
      ) : (
        <div className={styles.empty}>پایگاه داده در دسترس نیست. مهاجرت را اجرا کنید.</div>
      )}
    </>
  );
}
