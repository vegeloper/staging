"use client";

import { useId, useRef, useState } from "react";

import { libraryMediaId, mediaFilePath, mediaThumbPath } from "@/lib/media/paths";
import type { MediaKind } from "@/lib/media/types";
import MediaBrowser from "./MediaBrowser";
import { useScanToast } from "./ScanToast";
import { uploadMediaFile } from "./upload-media";
import styles from "./Admin.module.css";

type MediaFieldProps = {
  label: string;
  kind: MediaKind;
  value: string;
  disabled?: boolean;
  hint?: string;
  assets?: string[];
  onChange: (value: string) => void;
};

function builtinPreview(value: string, kind: MediaKind) {
  if (!value || libraryMediaId(value)) return null;
  if (kind === "video") return null;
  if (!/^\/(?:figma|videos|fonts|uploads)\//.test(value)) return null;
  if (!/\.(png|jpe?g|gif|webp)$/i.test(value)) return null;
  return value;
}

export default function MediaField({ label, kind, value, disabled, hint, assets, onChange }: MediaFieldProps) {
  const toast = useScanToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [over, setOver] = useState(false);
  const [picker, setPicker] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const libraryId = libraryMediaId(value);

  const accept = kind === "image" ? "image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp" : "video/mp4,video/webm,.mp4,.webm";

  function choose(next: string) {
    setThumbFailed(false);
    onChange(next);
  }

  async function take(file: File | undefined) {
    if (!file || disabled) return;
    const asset = await uploadMediaFile(file, toast, { altText: label });
    if (!asset) return;
    if (asset.kind !== kind) {
      toast.notify("warning", kind === "image" ? "فایل در کتابخانه ذخیره شد، اما این فیلد فقط تصویر می‌پذیرد." : "فایل در کتابخانه ذخیره شد، اما این فیلد فقط ویدیو می‌پذیرد.");
      return;
    }
    choose(mediaFilePath(asset.id));
  }

  const preview = libraryId && !thumbFailed ? mediaThumbPath(libraryId) : builtinPreview(value, kind);

  return (
    <div className={`${styles.mediaField} ${styles.span2}`}>
      <span className={styles.fieldTitle}>{label}</span>
      <div
        className={`${styles.dropZone} ${over ? styles.dropActive : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          void take(event.dataTransfer.files?.[0]);
        }}
      >
        <div className={styles.thumbFrame}>
          {preview ? (
            <img src={preview} alt="" onError={() => setThumbFailed(true)} />
          ) : (
            <span className={styles.typeBadge}>{kind === "image" ? "IMG" : "VIDEO"}</span>
          )}
        </div>
        <p className={styles.meta}>فایل را اینجا رها کنید، از رایانه انتخاب کنید، یا از کتابخانه بردارید.</p>
        {value ? <p className={`${styles.meta} ${styles.ltr}`}>{value}</p> : <p className={styles.meta}>{hint}</p>}
        <input
          ref={inputRef}
          className={styles.fileInput}
          type="file"
          accept={accept}
          disabled={disabled}
          aria-label={`${label} — انتخاب از رایانه`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void take(file);
          }}
        />
        <div className={styles.formActions}>
          <button className="button button-dark" type="button" disabled={disabled} onClick={() => inputRef.current?.click()}>
            انتخاب از رایانه
          </button>
          <button className="button button-dark" type="button" disabled={disabled} onClick={() => setPicker(true)}>
            انتخاب از کتابخانه
          </button>
          <button className="button button-dark" type="button" disabled={disabled || !value} onClick={() => choose("")}>
            پاک کردن
          </button>
        </div>
      </div>
      {assets ? (
        <>
          <input
            className={styles.ltr}
            list={listId}
            value={value}
            disabled={disabled}
            placeholder={hint || "خالی = فایل پیش‌فرض"}
            aria-label={`${label} — مسیر`}
            onChange={(event) => choose(event.target.value)}
          />
          <datalist id={listId}>
            {assets.map((asset) => (
              <option key={asset} value={asset} />
            ))}
          </datalist>
        </>
      ) : null}
      {picker ? (
        <div className={styles.picker} role="dialog" aria-modal="true" aria-label={`کتابخانه ${label}`}>
          <div className={styles.pickerPanel}>
            <div className={styles.formActions}>
              <strong>کتابخانه رسانه</strong>
              <button className="button button-dark" type="button" onClick={() => setPicker(false)}>
                بستن
              </button>
            </div>
            <MediaBrowser
              mode="select"
              lockedKind={kind}
              onSelect={(asset) => {
                choose(mediaFilePath(asset.id));
                setPicker(false);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
