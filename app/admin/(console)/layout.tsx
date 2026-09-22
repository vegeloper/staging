import Link from "next/link";

import LogoutButton from "@/components/admin/LogoutButton";
import styles from "@/components/admin/Admin.module.css";
import { requireUser } from "@/lib/auth";
import { canAccessCms, canManageSubmissions, homePathForRole, roleLabel } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/admin");

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarStart}>
          <Link href={homePathForRole(user.role)}>دات‌وان تریپ</Link>
          <nav className={styles.nav} aria-label="بخش‌های مدیریت">
            {canManageSubmissions(user.role) ? (
              <Link href="/admin">درخواست‌ها</Link>
            ) : null}
            {canAccessCms(user.role) ? <Link href="/admin/content">مطالب</Link> : null}
          </nav>
        </div>
        <span>
          {user.username} · {roleLabel(user.role)}
        </span>
        <LogoutButton />
      </header>
      <div className={styles.shell}>{children}</div>
    </div>
  );
}
