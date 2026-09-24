import Link from "next/link";

import AdminNav from "@/components/admin/AdminNav";
import LogoutButton from "@/components/admin/LogoutButton";
import ScanToastProvider from "@/components/admin/ScanToast";
import styles from "@/components/admin/Admin.module.css";
import { requireUser } from "@/lib/auth";
import { homePathForRole, roleLabel } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/admin");

  return (
    <ScanToastProvider>
      <div className={styles.frame}>
        <header className={styles.topbar}>
          <Link href={homePathForRole(user.role)}>دات‌وان تریپ</Link>
          <Link href="/admin/profile">
            {user.username} · {roleLabel(user.role)}
          </Link>
          <LogoutButton />
        </header>
        <div className={styles.body}>
          <AdminNav role={user.role} />
          <div className={styles.mainColumn}>
            <div className={styles.shell}>{children}</div>
          </div>
        </div>
      </div>
    </ScanToastProvider>
  );
}
