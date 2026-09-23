import PasswordForm from "@/components/admin/PasswordForm";
import styles from "@/components/admin/Admin.module.css";
import { requireUser } from "@/lib/auth";
import { roleLabel } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser("/admin/profile");

  return (
    <>
      <h1>پروفایل</h1>
      <p className={styles.meta}>
        {user.username} · {roleLabel(user.role)}
      </p>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>تغییر رمز عبور</h2>
        <p className={styles.meta}>رمز جدید حداقل ۱۲ نویسه است. نشست‌های دیگر این حساب بعد از تغییر بسته می‌شوند.</p>
        <PasswordForm />
      </section>
    </>
  );
}
