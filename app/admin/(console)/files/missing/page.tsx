import Link from "next/link";

import styles from "@/components/admin/Admin.module.css";

export const dynamic = "force-dynamic";

export default async function MissingFilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const name = typeof params.name === "string" ? params.name.slice(0, 180) : "";

  return (
    <div className={styles.missingFile}>
      <span className={styles.badge}>فایل در دسترس نیست</span>
      <h1>این فایل دیگر روی دیسک پیدا نشد</h1>
      <p>
        رکورد در پایگاه داده مانده است، اما خود فایل ذخیره شده در دسترس نیست. این حالت بعد از عوض شدن محل ذخیره‌سازی یا ساخت‌های قبلی که حجم محلی را به کانتینر وصل نکرده بودند پیش می‌آید.
      </p>
      {name ? <p className={`${styles.meta} ${styles.ltr}`}>{name}</p> : null}
      <div className={styles.formActions}>
        <Link className="button button-brand" href="/admin/submissions">
          بازگشت به درخواست‌ها
        </Link>
        <Link className="button button-dark" href="/admin/media">
          کتابخانه رسانه
        </Link>
      </div>
    </div>
  );
}
