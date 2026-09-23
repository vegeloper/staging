"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DEFAULT_COPYRIGHT } from "@/lib/site/defaults";
import styles from "./Admin.module.css";

type CopyrightEditorProps = {
  initial: string;
  published: string;
  revision: number;
  publishedAt: string | null;
};

export default function CopyrightEditor({
  initial,
  published,
  revision,
  publishedAt,
}: CopyrightEditorProps) {
  const router = useRouter();
  const [text, setText] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function send(action: "save" | "publish") {
    setPending(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/site/copyright", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, document: { text } }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error || "ذخیره کپی‌رایت ناموفق بود.");
      return;
    }
    setMessage(
      action === "publish"
        ? "کپی‌رایت منتشر شد و پاورقی سایت در درخواست بعدی به‌روز می‌شود."
        : "پیش‌نویس ذخیره شد. پاورقی هنوز متن منتشرشده را نشان می‌دهد.",
    );
    router.refresh();
  }

  return (
    <div className={styles.editor}>
      <p className={styles.meta}>
        نسخه منتشرشده: {revision.toLocaleString("fa-IR")}
        {publishedAt
          ? ` · ${new Date(publishedAt).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })}`
          : ""}
      </p>
      <div className={styles.formGrid}>
        <label className={styles.span2}>
          متن کپی‌رایت
          <textarea value={text} maxLength={400} onChange={(event) => setText(event.target.value)} />
        </label>
      </div>
      <p className={styles.meta}>متن منتشرشده در پاورقی: {published}</p>
      {error ? <p className={styles.warning}>{error}</p> : null}
      {message ? <p className={styles.note}>{message}</p> : null}
      <div className={styles.formActions}>
        <button className="button button-dark" type="button" disabled={pending} onClick={() => setText(DEFAULT_COPYRIGHT)}>
          متن پیش‌فرض
        </button>
        <button className="button button-dark" type="button" disabled={pending} onClick={() => send("save")}>
          ذخیره پیش‌نویس
        </button>
        <button className="button button-brand" type="button" disabled={pending} onClick={() => send("publish")}>
          {pending ? "در حال انتشار..." : "انتشار کپی‌رایت"}
        </button>
      </div>
    </div>
  );
}
