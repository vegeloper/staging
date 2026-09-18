"use client";

import { useEffect, useState } from "react";

import CareerForm from "./CareerForm";
import DriverForm from "./DriverForm";
import { FormShell, formStyles as styles } from "./FormShell";

export default function JoinForms() {
  const [tab, setTab] = useState<"drivers" | "office">("drivers");

  useEffect(() => {
    if (window.location.hash === "#join-office") setTab("office");
    if (window.location.hash === "#join-drivers") setTab("drivers");
  }, []);

  return (
    <FormShell
      id="join"
      eyebrow="همکاری با دات‌وان تریپ"
      title="به ناوگان یا تیم ستادی بپیوندید"
      description="درخواست همکاری رانندگی یا موقعیت‌های اداری را از همین‌جا ارسال کنید."
    >
      <div id="join-drivers" />
      <div id="join-office" />
      <div className={styles.tabs} role="tablist" aria-label="نوع همکاری">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "drivers"}
          className={`${styles.tab} ${tab === "drivers" ? styles.tabActive : ""}`}
          onClick={() => setTab("drivers")}
        >
          رانندگان
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "office"}
          className={`${styles.tab} ${tab === "office" ? styles.tabActive : ""}`}
          onClick={() => setTab("office")}
        >
          فرصت‌های اداری
        </button>
      </div>
      {tab === "drivers" ? <DriverForm /> : <CareerForm />}
    </FormShell>
  );
}
