import Link from "next/link";

import PositionEditor from "@/components/admin/PositionEditor";
import styles from "@/components/admin/Admin.module.css";
import { requirePositionsUser } from "@/lib/auth";
import { editorPermissions } from "@/lib/jobs/workflow";

export const dynamic = "force-dynamic";

export default async function NewPositionPage() {
  const user = await requirePositionsUser("/admin/positions/new");

  return (
    <>
      <Link href="/admin/positions" className={styles.backButton}>
        بازگشت به موقعیت‌ها
      </Link>
      <h1>موقعیت جدید</h1>
      <PositionEditor
        mode="create"
        permissions={editorPermissions({ userId: user.id, role: user.role }, null)}
      />
    </>
  );
}
