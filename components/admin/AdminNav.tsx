"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase,
  Copyright,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Newspaper,
  Palette,
  PanelRightClose,
  PanelRightOpen,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import {
  canAccessCms,
  canManagePositions,
  canManageSite,
  canManageSubmissions,
  type UserRole,
} from "@/lib/auth/rbac";
import styles from "./Admin.module.css";

const STORAGE_KEY = "admin-sidebar";

const tabs: Array<{
  href: string;
  label: string;
  allow: (role: UserRole) => boolean;
  icon: LucideIcon;
}> = [
  { href: "/admin", label: "پیشخوان", allow: canManageSite, icon: LayoutDashboard },
  { href: "/admin/submissions", label: "درخواست‌ها", allow: canManageSubmissions, icon: Inbox },
  { href: "/admin/positions", label: "موقعیت‌های شغلی", allow: canManagePositions, icon: Briefcase },
  { href: "/admin/content", label: "مطالب", allow: canAccessCms, icon: Newspaper },
  { href: "/admin/media", label: "رسانه", allow: canAccessCms, icon: ImageIcon },
  { href: "/admin/theme", label: "تم", allow: canManageSite, icon: Palette },
  { href: "/admin/copyright", label: "کپی‌رایت", allow: canManageSite, icon: Copyright },
  { href: "/admin/profile", label: "پروفایل", allow: () => true, icon: UserRound },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const visible = tabs.filter((tab) => tab.allow(role));
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "collapsed");
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded");
      return next;
    });
    setHovering(false);
  }

  const peeking = collapsed && hovering;

  return (
    <div
      className={`${styles.sidebarSlot} ${collapsed ? styles.sidebarSlotCollapsed : ""} ${peeking ? styles.sidebarSlotPeek : ""}`}
    >
      <aside
        className={`${styles.sidebar} ${peeking ? styles.sidebarPeek : ""}`}
        onMouseEnter={() => {
          if (collapsed) setHovering(true);
        }}
        onMouseLeave={() => setHovering(false)}
      >
        <nav className={styles.nav} aria-label="بخش‌های مدیریت">
          {visible.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                title={tab.label}
                aria-current={isCurrent(pathname, tab.href) ? "page" : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                <span className={styles.navLabel}>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <button
        className={styles.sidebarToggle}
        type="button"
        aria-expanded={!collapsed}
        aria-label={collapsed ? "باز کردن منو" : "جمع کردن منو"}
        onClick={toggle}
      >
        {collapsed ? <PanelRightOpen size={18} aria-hidden="true" /> : <PanelRightClose size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
