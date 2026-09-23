"use client";

import { useRef, useState } from "react";

import MediaBrowser from "./MediaBrowser";
import { useScanToast } from "./ScanToast";
import { uploadMediaFile } from "./upload-media";
import styles from "./Admin.module.css";

export default function MediaLibrary() {
  const toast = useScanToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [revision, setRevision] = useState(0);

  async function take(file: File | undefined) {
    if (!file) return;
    const asset = await uploadMediaFile(file, toast);
    if (asset) setRevision((current) => current + 1);
  }

  return (
    <div className={styles.browser}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>بارگذاری رسانه</h2>
        <div
          className={`${styles.dropZone} ${over ? styles.dropActive : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            void take(event.dataTransfer.files?.[0]);
          }}
        >
          <p>تصویر یا ویدیو را اینجا رها کنید. فایل فقط بعد از بررسی ساختار و پویش ویروس به کتابخانه اضافه می‌شود.</p>
          <input
            ref={inputRef}
            className={styles.fileInput}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,.png,.jpg,.jpeg,.gif,.webp,.mp4,.webm"
            aria-label="بارگذاری رسانه از رایانه"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void take(file);
            }}
          />
          <button className="button button-brand" type="button" onClick={() => inputRef.current?.click()}>
            انتخاب از رایانه
          </button>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>فهرست کتابخانه</h2>
        <p className={styles.meta}>
          فهرست و صفحه جزئیات فقط تصویر بندانگشتی کوچک نشان می‌دهند. فایل اصلی وقتی بارگذاری می‌شود که نمایش بزرگ یا پخش را بزنید.
        </p>
        <MediaBrowser mode="navigate" revision={revision} />
      </section>
    </div>
  );
}
