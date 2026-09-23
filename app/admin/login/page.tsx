import { Suspense } from "react";
import { redirect } from "next/navigation";

import LoginForm from "@/components/admin/LoginForm";
import styles from "@/components/admin/Admin.module.css";
import { readSessionUser } from "@/lib/auth";
import { homePathForRole } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await readSessionUser();
  if (user) redirect(homePathForRole(user.role));

  return (
    <div className={styles.loginWrap}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
