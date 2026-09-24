"use client";

import { useEffect, useRef, useState } from "react";

import MediaBrowser from "./MediaBrowser";
import { formatBytes } from "./media-format";
import { useScanToast } from "./ScanToast";
import { uploadMediaFile } from "./upload-media";
import styles from "./Admin.module.css";

type PendingFile = {
  file: File;
  url: string;
  kind: "image" | "video" | "other";
};

function previewKind(file: File): PendingFile["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "other";
}

export default function MediaLibrary({ canDelete = false }: { canDelete?: boolean }) {
  const toast = useScanToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [pending, setPending] = useState<PendingFile | null>(null);
  const pendingRef = useRef<PendingFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    return () => {
      if (pendingRef.current) URL.revokeObjectURL(pendingRef.current.url);
    };
  }, []);

  function stage(file: File | undefined) {
    if (!file || busy) return;
    const url = URL.createObjectURL(file);
    if (pendingRef.current) URL.revokeObjectURL(pendingRef.current.url);
    const next = { file, url, kind: previewKind(file) };
    pendingRef.current = next;
    setPending(next);
  }

  function clearPending() {
    if (pendingRef.current) URL.revokeObjectURL(pendingRef.current.url);
    pendingRef.current = null;
    setPending(null);
  }

  async function submit() {
    if (!pending || busy) return;
    setBusy(true);
    const asset = await uploadMediaFile(pending.file, toast);
    setBusy(false);
    if (asset) {
      setRevision((current) => current + 1);
      clearPending();
    }
  }

  return (
    <div className={styles.browser}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>بارگذاری رسانه</h2>
        <div
          className={`${styles.dropZone} ${styles.dropZoneTall} ${over ? styles.dropActive : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            stage(event.dataTransfer.files?.[0]);
          }}
        >
          <p>
            تصویر یا ویدیو را اینجا رها کنید. فایل تا زدن دکمه بارگذاری به کتابخانه اضافه نمی‌شود و فقط بعد از بررسی ساختار و اسکن ویروس پذیرفته می‌شود.
          </p>
          <input
            ref={inputRef}
            className={styles.fileInput}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,.png,.jpg,.jpeg,.gif,.webp,.mp4,.webm"
            aria-label="بارگذاری رسانه از رایانه"
            onChange={(event) => {
              stage(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          {pending ? (
            <div className={styles.pendingFile}>
              {pending.kind === "image" ? (
                <img className={styles.pendingThumb} src={pending.url} alt="" />
              ) : pending.kind === "video" ? (
                <video className={styles.pendingThumb} src={pending.url} muted playsInline />
              ) : (
                <span className={styles.typeBadge}>فایل</span>
              )}
              <div className={styles.pendingMeta}>
                <strong>{pending.file.name}</strong>
                <span>{formatBytes(pending.file.size)}</span>
              </div>
            </div>
          ) : null}
          <div className={styles.pendingActions}>
            <button className="button button-dark" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
              انتخاب از رایانه
            </button>
            <button className="button button-brand" type="button" disabled={!pending || busy} onClick={() => void submit()}>
              {busy ? "در حال بارگذاری..." : "بارگذاری در کتابخانه"}
            </button>
            {pending ? (
              <button className="button button-dark" type="button" disabled={busy} onClick={clearPending}>
                حذف انتخاب
              </button>
            ) : null}
          </div>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>فهرست کتابخانه</h2>
        <p className={styles.meta}>
          فهرست و صفحه جزئیات فقط تصویر بندانگشتی کوچک نشان می‌دهند. فایل اصلی وقتی بارگذاری می‌شود که نمایش بزرگ یا پخش را بزنید.
        </p>
        <MediaBrowser mode="navigate" revision={revision} canDelete={canDelete} />
      </section>
    </div>
  );
}
