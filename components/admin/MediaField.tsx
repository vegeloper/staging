"use client";

import { useEffect, useId, useRef, useState } from "react";

import { libraryMediaId, mediaFilePath, mediaThumbPath } from "@/lib/media/paths";
import type { MediaKind } from "@/lib/media/types";
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
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [fullSrc, setFullSrc] = useState<string | null>(null);
  const pendingRef = useRef<PendingFile | null>(null);
  const libraryId = libraryMediaId(value);

  useEffect(() => {
    return () => {
      if (pendingRef.current) URL.revokeObjectURL(pendingRef.current.url);
    };
  }, []);

  const accept = kind === "image" ? "image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp" : "video/mp4,video/webm,.mp4,.webm";

  function choose(next: string) {
    setThumbFailed(false);
    onChange(next);
  }

  function stage(file: File | undefined) {
    if (!file || disabled || busy) return;
    const url = URL.createObjectURL(file);
    if (pendingRef.current) URL.revokeObjectURL(pendingRef.current.url);
    const next: PendingFile = {
      file,
      url,
      kind: file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : "other",
    };
    pendingRef.current = next;
    setPending(next);
  }

  function clearPending() {
    if (pendingRef.current) URL.revokeObjectURL(pendingRef.current.url);
    pendingRef.current = null;
    setPending(null);
  }

  async function submit() {
    if (!pending || disabled || busy) return;
    setBusy(true);
    const asset = await uploadMediaFile(pending.file, toast, { altText: label });
    setBusy(false);
    if (!asset) return;
    if (asset.kind !== kind) {
      toast.notify("warning", kind === "image" ? "فایل در کتابخانه ذخیره شد، اما این فیلد فقط تصویر می‌پذیرد." : "فایل در کتابخانه ذخیره شد، اما این فیلد فقط ویدیو می‌پذیرد.");
      return;
    }
    choose(mediaFilePath(asset.id));
    clearPending();
  }

  const thumb =
    libraryId && !thumbFailed
      ? mediaThumbPath(libraryId)
      : kind === "image" && !thumbFailed
        ? builtinPreview(value, kind)
        : null;
  const localFull =
    kind === "video" && /^\/(?:videos|uploads)\//.test(value) && /\.(mp4|webm)$/i.test(value)
      ? value
      : builtinPreview(value, kind);
  const fullQuality = libraryId ? mediaFilePath(libraryId) : localFull;

  useEffect(() => {
    if (!fullSrc) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setFullSrc(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullSrc]);

  return (
    <div className={styles.mediaField}>
      <span className={styles.fieldTitle}>{label}</span>
      <div
        className={`${styles.dropZone} ${styles.dropZoneCompact} ${over ? styles.dropActive : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          stage(event.dataTransfer.files?.[0]);
        }}
      >
        <p className={styles.meta}>
          فایل را اینجا رها کنید. پیش‌نمایش کوچک است و فایل اصلی فقط با نمایش بزرگ بارگذاری می‌شود.
        </p>
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
        ) : value ? (
          <div className={styles.pendingFile}>
            <button
              className={styles.thumbButton}
              type="button"
              disabled={!fullQuality}
              aria-label={`${label} — نمایش بزرگ`}
              onClick={() => fullQuality && setFullSrc(fullQuality)}
            >
              {thumb ? (
                <img className={styles.pendingThumb} src={thumb} alt="" onError={() => setThumbFailed(true)} />
              ) : (
                <span className={styles.typeBadge}>{kind === "image" ? "IMG" : "VIDEO"}</span>
              )}
            </button>
            <div className={styles.pendingMeta}>
              <strong>{label}</strong>
              <span className={styles.ltr}>{value}</span>
              <button
                className={styles.enlargeAction}
                type="button"
                disabled={!fullQuality}
                onClick={() => fullQuality && setFullSrc(fullQuality)}
              >
                نمایش بزرگ
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.meta}>{hint}</p>
        )}
        <input
          ref={inputRef}
          className={styles.fileInput}
          type="file"
          accept={accept}
          disabled={disabled}
          aria-label={`${label} — انتخاب از رایانه`}
          onChange={(event) => {
            stage(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <div className={styles.pendingActions}>
          <button className="button button-dark" type="button" disabled={disabled || busy} onClick={() => inputRef.current?.click()}>
            انتخاب از رایانه
          </button>
          <button className="button button-brand" type="button" disabled={disabled || busy || !pending} onClick={() => void submit()}>
            {busy ? "در حال بارگذاری..." : "بارگذاری در کتابخانه"}
          </button>
          {pending ? (
            <button className="button button-dark" type="button" disabled={disabled || busy} onClick={clearPending}>
              حذف انتخاب
            </button>
          ) : null}
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
      {fullSrc ? (
        <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={label} onClick={() => setFullSrc(null)}>
          <button
            className={styles.viewerClose}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setFullSrc(null);
            }}
          >
            بستن
          </button>
          {kind === "image" ? (
            <img src={fullSrc} alt={label} onClick={(event) => event.stopPropagation()} />
          ) : (
            <video src={fullSrc} controls autoPlay playsInline onClick={(event) => event.stopPropagation()} />
          )}
        </div>
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
