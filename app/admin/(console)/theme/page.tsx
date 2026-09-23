import ThemeEditor from "@/components/admin/ThemeEditor";
import styles from "@/components/admin/Admin.module.css";
import { requireAdminUser } from "@/lib/auth";
import { listThemeAssetPaths } from "@/lib/site/assets";
import { readThemeDocument } from "@/lib/site/store";

export const dynamic = "force-dynamic";

export default async function ThemePage() {
  await requireAdminUser("/admin/theme");

  let document: Awaited<ReturnType<typeof readThemeDocument>> | null = null;
  let assets: string[] = [];
  try {
    [document, assets] = await Promise.all([readThemeDocument(), listThemeAssetPaths()]);
  } catch (error) {
    console.error(error);
  }

  if (!document) {
    return <div className={styles.empty}>پایگاه داده پوسته در دسترس نیست. مهاجرت را اجرا کنید.</div>;
  }

  return (
    <>
      <h1>پوسته سایت</h1>
      <p className={styles.meta}>
        رنگ‌ها، پس‌زمینه، لوگوها و ویدیوی کمپین از اینجا منتشر می‌شوند. انتشار، کش همین فرآیند Next.js را باطل می‌کند و مقدار تازه را ذخیره می‌کند.
      </p>
      <ThemeEditor
        initial={document.draft}
        revision={document.revision}
        publishedAt={document.publishedAt}
        assets={assets}
      />
    </>
  );
}
