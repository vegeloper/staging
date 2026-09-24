"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { MediaKind, MediaListItem } from "@/lib/media/types";
import { formatBytes, formatWhen } from "./media-format";
import MediaViewer from "./MediaViewer";
import ShamsiDateField from "./ShamsiDateField";
import styles from "./Admin.module.css";

type MediaBrowserProps = {
  mode: "navigate" | "select";
  revision?: number;
  lockedKind?: MediaKind;
  canDelete?: boolean;
  onSelect?: (asset: MediaListItem) => void;
};

type ListResponse = {
  items: MediaListItem[];
  page: number;
  total: number;
  pageSize: number;
};

const sorts = [
  { value: "newest", label: "جدیدترین" },
  { value: "oldest", label: "قدیمی‌ترین" },
  { value: "name", label: "نام" },
  { value: "size", label: "حجم" },
  { value: "type", label: "نوع فایل" },
] as const;

const extensions = ["jpg", "png", "gif", "webp", "mp4", "webm"] as const;

export default function MediaBrowser({ mode, revision = 0, lockedKind, canDelete = false, onSelect }: MediaBrowserProps) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"" | MediaKind>(lockedKind ?? "");
  const [ext, setExt] = useState("");
  const [sort, setSort] = useState<(typeof sorts)[number]["value"]>("newest");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewer, setViewer] = useState<MediaListItem | null>(null);
  const [brokenThumbs, setBrokenThumbs] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [armed, setArmed] = useState(false);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      const activeKind = lockedKind ?? kind;
      if (query.trim()) params.set("q", query.trim());
      if (activeKind) params.set("kind", activeKind);
      if (ext) params.set("ext", ext);
      params.set("sort", sort);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("page", String(page));
      try {
        const response = await fetch(`/api/admin/media?${params}`, { signal: controller.signal });
        const body = (await response.json().catch(() => ({}))) as ListResponse & { error?: string };
        if (!response.ok) {
          setError(body.error || "فهرست رسانه بارگذاری نشد.");
          setData(null);
        } else {
          setData(body);
        }
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        setError("فهرست رسانه بارگذاری نشد.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [query, kind, ext, sort, from, to, page, revision, lockedKind, reload]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const pageIds = data?.items.map((item) => item.id) ?? [];
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setArmed(false);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function remove(ids: string[]) {
    setRemoving(true);
    setError("");
    const response = await fetch("/api/admin/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "media", ids }),
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setRemoving(false);
    if (!response.ok) {
      setError(body.error || "حذف ناموفق بود.");
      return;
    }
    setSelected(new Set());
    setArmed(false);
    setReload((current) => current + 1);
  }

  return (
    <div className={styles.browser}>
      <div className={styles.filters}>
        <label>
          جستجو
          <input
            value={query}
            placeholder="نام، توضیح یا متن جایگزین"
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
          />
        </label>
        {lockedKind ? null : (
          <label>
            نوع
            <select
              value={kind}
              onChange={(event) => {
                setPage(1);
                setKind(event.target.value as "" | MediaKind);
              }}
            >
              <option value="">همه</option>
              <option value="image">تصویر</option>
              <option value="video">ویدیو</option>
            </select>
          </label>
        )}
        <label>
          پسوند فایل
          <select
            value={ext}
            onChange={(event) => {
              setPage(1);
              setExt(event.target.value);
            }}
          >
            <option value="">همه پسوندها</option>
            {extensions.map((value) => (
              <option key={value} value={value}>
                .{value}
              </option>
            ))}
          </select>
        </label>
        <label>
          مرتب‌سازی
          <select
            value={sort}
            onChange={(event) => {
              setPage(1);
              setSort(event.target.value as (typeof sorts)[number]["value"]);
            }}
          >
            {sorts.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          از تاریخ
          <ShamsiDateField
            mode="iso"
            value={from}
            onChange={(next) => {
              setPage(1);
              setFrom(next);
            }}
          />
        </label>
        <label>
          تا تاریخ
          <ShamsiDateField
            mode="iso"
            value={to}
            onChange={(next) => {
              setPage(1);
              setTo(next);
            }}
          />
        </label>
      </div>

      {error ? <p className={styles.warning}>{error}</p> : null}
      {canDelete && mode === "navigate" ? (
        <div className={styles.deleteBar}>
          <button
            className="button button-dark"
            type="button"
            disabled={removing || pageIds.length === 0}
            onClick={() => {
              setArmed(false);
              setSelected(allSelected ? new Set() : new Set(pageIds));
            }}
          >
            {allSelected ? "لغو انتخاب صفحه" : "انتخاب همه این صفحه"}
          </button>
          <button
            className="button button-dark"
            type="button"
            disabled={removing || selected.size === 0}
            onClick={() => {
              if (!armed) {
                setArmed(true);
                return;
              }
              void remove([...selected]);
            }}
          >
            {armed ? "تأیید حذف گروهی" : `حذف گروهی (${selected.size.toLocaleString("fa-IR")})`}
          </button>
        </div>
      ) : null}
      {loading ? <p className={styles.meta}>در حال بارگذاری فهرست...</p> : null}

      <div className={styles.mediaGrid}>
        {data?.items.map((item) => {
          const showThumb = Boolean(item.thumbUrl) && !brokenThumbs[item.id];
          const thumb = (
            <span className={styles.thumbFrame}>
              {showThumb ? (
                <img
                  src={item.thumbUrl!}
                  alt=""
                  onError={() => setBrokenThumbs((current) => ({ ...current, [item.id]: true }))}
                />
              ) : (
                <span className={styles.typeBadge}>{item.extension.toUpperCase()}</span>
              )}
              <span className={styles.extMark}>
                <FileTypeIcon kind={item.kind} />
                {item.extension.toUpperCase()}
              </span>
            </span>
          );
          return (
            <article key={item.id} className={styles.mediaCard}>
              {canDelete && mode === "navigate" ? (
                <label className={styles.pickRow}>
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    aria-label={`انتخاب ${item.originalName}`}
                    onChange={() => toggle(item.id)}
                  />
                  انتخاب برای حذف
                </label>
              ) : null}
              <button
                className={styles.thumbButton}
                type="button"
                aria-label={`نمایش بزرگ ${item.originalName}`}
                onClick={() => setViewer(item)}
              >
                {thumb}
              </button>
              <div className={styles.mediaMeta}>
                <strong>{item.originalName}</strong>
                <span>
                  {item.kind === "image" ? "تصویر" : "ویدیو"} · {item.extension.toUpperCase()} · {formatBytes(item.byteSize)}
                </span>
                <span>{item.description || "بدون توضیح"}</span>
                <span>{formatWhen(item.createdAt)}</span>
                <span>{item.uploaderName ? `بارگذاری: ${item.uploaderName}` : "بارگذاری‌کننده نامشخص"}</span>
                {item.scanResult === "clean" ? (
                  <span className={styles.scanClean}>NO VIRUS, CLEAN</span>
                ) : (
                  <span>اسکن: {item.scanResult}</span>
                )}
              </div>
              {mode === "navigate" ? (
                <div className={styles.pendingActions}>
                  <Link className="button button-dark" href={`/admin/media/${item.id}`}>
                    جزئیات
                  </Link>
                  {canDelete ? (
                    <button
                      className={styles.deleteOne}
                      type="button"
                      disabled={removing}
                      onClick={() => {
                        if (armedId !== item.id) {
                          setArmedId(item.id);
                          return;
                        }
                        void remove([item.id]);
                      }}
                    >
                      {armedId === item.id ? "تأیید" : "حذف"}
                    </button>
                  ) : null}
                </div>
              ) : (
                <button className="button button-brand" type="button" onClick={() => onSelect?.(item)}>
                  انتخاب
                </button>
              )}
            </article>
          );
        })}
      </div>

      {!loading && data && data.items.length === 0 ? (
        <p className={styles.meta}>رسانه‌ای با این فیلتر پیدا نشد.</p>
      ) : null}

      {data && data.total > data.pageSize ? (
        <div className={styles.formActions}>
          <button className="button button-dark" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
            قبلی
          </button>
          <span className={styles.meta}>
            صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}
          </span>
          <button
            className="button button-dark"
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((current) => current + 1)}
          >
            بعدی
          </button>
        </div>
      ) : null}

      {viewer ? (
        <MediaViewer
          id={viewer.id}
          kind={viewer.kind}
          name={viewer.originalName}
          onClose={() => setViewer(null)}
        />
      ) : null}
    </div>
  );
}

function FileTypeIcon({ kind }: { kind: MediaKind }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {kind === "image" ? (
        <path d="M8 16l2.2-2.2a1 1 0 0 1 1.4 0L14 16l1-1a1 1 0 0 1 1.4 0L18 16.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : (
        <path d="M10 11.5v5l4-2.5-4-2.5z" fill="currentColor" />
      )}
    </svg>
  );
}
