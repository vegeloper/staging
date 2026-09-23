"use client";

import { useState } from "react";

import styles from "./Admin.module.css";
import { useScanToast } from "./ScanToast";

type Phase = "idle" | "pending" | "ok" | "bad";

export default function PasswordForm() {
  const toast = useScanToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");

  function flash(next: "ok" | "bad") {
    setPhase(next);
    window.setTimeout(() => setPhase("idle"), 900);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (phase === "pending") return;
    if (newPassword !== confirmPassword) {
      toast.notify("error", "تکرار رمز با رمز جدید یکی نیست.");
      flash("bad");
      return;
    }
    if (newPassword.length < 12) {
      toast.notify("error", "رمز جدید حداقل ۱۲ نویسه است.");
      flash("bad");
      return;
    }

    setPhase("pending");
    try {
      const response = await fetch("/api/admin/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        toast.notify("error", data.error || "تغییر رمز ناموفق بود.");
        flash("bad");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.notify("success", "رمز عبور عوض شد.");
      flash("ok");
    } catch {
      toast.notify("error", "ارتباط با سرور قطع شد.");
      flash("bad");
    }
  }

  const buttonClass = [
    "button",
    "button-brand",
    styles.passwordButton,
    phase === "ok" ? styles.passwordOk : "",
    phase === "bad" ? styles.passwordBad : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form className={styles.formGrid} onSubmit={(event) => void submit(event)}>
      <label>
        رمز فعلی
        <input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>
      <label>
        رمز جدید
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>
      <label className={styles.span2}>
        تکرار رمز جدید
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </label>
      <div className={styles.formActions}>
        <button className={buttonClass} type="submit" disabled={phase === "pending"} aria-busy={phase === "pending"}>
          {phase === "pending" ? (
            <>
              <span className={styles.fillOne} aria-hidden="true">
                1
              </span>
              <span className={styles.visuallyHidden}>در حال تغییر رمز</span>
            </>
          ) : (
            "تغییر رمز"
          )}
        </button>
      </div>
    </form>
  );
}
