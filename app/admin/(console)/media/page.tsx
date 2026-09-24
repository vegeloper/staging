import MediaLibrary from "@/components/admin/MediaLibrary";
import styles from "@/components/admin/Admin.module.css";
import { requireCmsUser } from "@/lib/auth";
import { canManageSite } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const user = await requireCmsUser("/admin/media");

  return (
    <>
      <h1>کتابخانه رسانه</h1>
      <p className={styles.meta}>
        مدیر و تیم محتوا تصویر و ویدیو را اینجا بارگذاری می‌کنند. فایل اجرایی که فقط پسوند تصویر یا ویدیو دارد رد می‌شود، و هیچ فایلی پیش از اسکن ویروس ذخیره نمی‌شود.
        {canManageSite(user.role) ? " حذف تکی و گروهی فقط برای مدیر وب‌سایت است." : ""}
      </p>
      <MediaLibrary canDelete={canManageSite(user.role)} />
    </>
  );
}
