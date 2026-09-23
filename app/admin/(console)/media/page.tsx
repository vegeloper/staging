import MediaLibrary from "@/components/admin/MediaLibrary";
import styles from "@/components/admin/Admin.module.css";
import { requireCmsUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requireCmsUser("/admin/media");

  return (
    <>
      <h1>کتابخانه رسانه</h1>
      <p className={styles.meta}>
        مدیر و تیم محتوا تصویر و ویدیو را اینجا بارگذاری می‌کنند. فایل اجرایی که فقط پسوند تصویر یا ویدیو دارد رد می‌شود، و هیچ فایلی پیش از پویش ویروس ذخیره نمی‌شود.
      </p>
      <MediaLibrary />
    </>
  );
}
