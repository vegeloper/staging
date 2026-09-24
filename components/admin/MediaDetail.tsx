"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { MediaListItem } from "@/lib/media/types";
import { formatBytes, formatDuration, formatWhen } from "./media-format";
import MediaViewer from "./MediaViewer";
import styles from "./Admin.module.css";

type MediaDetailProps = {
  asset: MediaListItem;
  canManage: boolean;
  canDelete: boolean;
};

export default function MediaDetail({ asset, canManage, canDelete }: MediaDetailProps) {
  const router = useRouter();
  const [description, setDescription] = useState(asset.description);
  const [altText, setAltText] = useState(asset.altText);
  const [current, setCurrent] = useState(asset);
  const [open, setOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    setPending(true);
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/media/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, altText }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; asset?: MediaListItem };
    setPending(false);
    if (!response.ok || !data.asset) {
      setError(data.error || "ذخیره توضیح ناموفق بود.");
      return;
    }
    setCurrent(data.asset);
    setMessage("توضیح ذخیره شد.");
  }

  async function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setPending(true);
    const response = await fetch(`/api/admin/media/${asset.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "حذف ناموفق بود.");
      setPending(false);
      return;
    }
    router.push("/admin/media");
    router.refresh();
  }

  const rows: Array<[string, string]> = [
    ["نام فایل", current.originalName],
    ["نوع", current.kind === "image" ? "تصویر" : "ویدیو"],
    ["قالب", `${current.mimeType} (.${current.extension})`],
    ["حجم", formatBytes(current.byteSize)],
    ["ابعاد", current.width && current.height ? `${current.width.toLocaleString("fa-IR")} × ${current.height.toLocaleString("fa-IR")}` : "—"],
    ["مدت", formatDuration(current.durationMs)],
    ["شناسه", current.id],
    ["اثرانگشت", current.sha256],
    ["موتور اسکن", current.scanEngine],
    ["نتیجه اسکن", current.scanResult === "clean" ? "NO VIRUS, CLEAN" : current.scanResult],
    ["بارگذاری‌کننده", current.uploaderName || "—"],
    ["زمان بارگذاری", formatWhen(current.createdAt)],
    ["آخرین تغییر", formatWhen(current.updatedAt)],
  ];

  return (
    <div className={styles.editor}>
      <Link className={styles.backButton} href="/admin/media">
        بازگشت به کتابخانه
      </Link>
      <div className={styles.detailLayout}>
        <div>
          <div className={styles.thumbFrame}>
            {current.thumbUrl && !thumbFailed ? (
              <img src={current.thumbUrl} alt="" onError={() => setThumbFailed(true)} />
            ) : (
              <span className={styles.typeBadge}>{current.extension.toUpperCase()}</span>
            )}
          </div>
          <button className="button button-brand" type="button" onClick={() => setOpen(true)}>
            {current.kind === "video" ? "پخش" : "نمایش بزرگ"}
          </button>
        </div>
        <dl className={styles.metaTable}>
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={label === "شناسه" || label === "اثرانگشت" ? styles.ltr : undefined}>
                {label === "نتیجه اسکن" && value === "NO VIRUS, CLEAN" ? (
                  <span className={styles.scanClean}>{value}</span>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.span2}>
          توضیح
          <textarea value={description} disabled={!canManage || pending} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className={styles.span2}>
          متن جایگزین
          <input value={altText} disabled={!canManage || pending} onChange={(event) => setAltText(event.target.value)} />
        </label>
      </div>
      {error ? <p className={styles.warning}>{error}</p> : null}
      {message ? <p className={styles.note}>{message}</p> : null}
      {canManage ? (
        <div className={styles.formActions}>
          <button className="button button-brand" type="button" disabled={pending} onClick={() => void save()}>
            ذخیره توضیح
          </button>
          {canDelete ? (
            <button className="button button-dark" type="button" disabled={pending} onClick={() => void remove()}>
              {confirmDelete ? "تأیید حذف" : "حذف از کتابخانه"}
            </button>
          ) : null}
        </div>
      ) : (
        <p className={styles.meta}>فقط مدیر یا کسی که این فایل را بارگذاری کرده می‌تواند توضیح آن را تغییر دهد.</p>
      )}
      {open ? (
        <MediaViewer id={current.id} kind={current.kind} name={current.originalName} onClose={() => setOpen(false)} />
      ) : null}
    </div>
  );
}
