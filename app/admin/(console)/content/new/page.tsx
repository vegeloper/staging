import Link from "next/link";

import ContentEditor from "@/components/admin/ContentEditor";
import styles from "@/components/admin/Admin.module.css";
import { requireCmsUser } from "@/lib/auth";
import { editorPermissions } from "@/lib/cms/workflow";

export const dynamic = "force-dynamic";

export default async function NewContentPage() {
  const user = await requireCmsUser("/admin/content/new");

  return (
    <>
      <Link href="/admin/content" className={styles.backButton}>
        بازگشت به مطالب
      </Link>
      <h1>مطلب جدید</h1>
      <ContentEditor
        mode="create"
        permissions={editorPermissions(
          { userId: user.id, role: user.role },
          null,
        )}
      />
    </>
  );
}
