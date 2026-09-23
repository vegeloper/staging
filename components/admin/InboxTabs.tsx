import Link from "next/link";

import styles from "./Admin.module.css";

const tabs = [
  { href: "/admin/submissions", id: "submissions", label: "رزومه‌ها و درخواست‌ها" },
  { href: "/admin/positions", id: "positions", label: "موقعیت‌های شغلی" },
] as const;

export default function InboxTabs({ current }: { current: "submissions" | "positions" }) {
  return (
    <div className={styles.sectionTabs} role="tablist" aria-label="استخدام و رزومه‌ها">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          role="tab"
          aria-selected={current === tab.id}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
