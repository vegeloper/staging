import CopyrightEditor from "@/components/admin/CopyrightEditor";
import styles from "@/components/admin/Admin.module.css";
import { requireAdminUser } from "@/lib/auth";
import { readCopyrightDocument } from "@/lib/site/store";

export const dynamic = "force-dynamic";

export default async function CopyrightPage() {
  await requireAdminUser("/admin/copyright");

  let document: Awaited<ReturnType<typeof readCopyrightDocument>> | null = null;
  try {
    document = await readCopyrightDocument();
  } catch (error) {
    console.error(error);
  }

  if (!document) {
    return <div className={styles.empty}>پایگاه داده کپی‌رایت در دسترس نیست. مهاجرت را اجرا کنید.</div>;
  }

  return (
    <>
      <h1>کپی‌رایت</h1>
      <p className={styles.meta}>
        این متن در پایین همه صفحه‌هایی که پاورقی دارند جایگزین می‌شود. HTML ذخیره نمی‌شود.
      </p>
      <CopyrightEditor
        initial={document.draft}
        published={document.published}
        revision={document.revision}
        publishedAt={document.publishedAt}
      />
    </>
  );
}
