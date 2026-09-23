"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { canAccessCms, canManageSite, canManageSubmissions, type UserRole } from "@/lib/auth/rbac";
import styles from "./Admin.module.css";

const tabs = [
  { href: "/admin", label: "پیشخوان", allow: canManageSite },
  { href: "/admin/submissions", label: "درخواست‌ها", allow: canManageSubmissions },
  { href: "/admin/content", label: "مطالب", allow: canAccessCms },
  { href: "/admin/media", label: "رسانه", allow: canAccessCms },
  { href: "/admin/theme", label: "پوسته", allow: canManageSite },
  { href: "/admin/copyright", label: "کپی‌رایت", allow: canManageSite },
] as const;

function isCurrent(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const visible = tabs.filter((tab) => tab.allow(role));

  return (
    <nav className={styles.nav} aria-label="بخش‌های مدیریت">
      {visible.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={isCurrent(pathname, tab.href) ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
