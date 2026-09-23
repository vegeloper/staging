"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { MediaKind, MediaListItem } from "@/lib/media/types";
import { formatBytes, formatWhen } from "./media-format";
import MediaViewer from "./MediaViewer";
import styles from "./Admin.module.css";

type MediaBrowserProps = {
  mode: "navigate" | "select";
  revision?: number;
  lockedKind?: MediaKind;
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

export default function MediaBrowser({ mode, revision = 0, lockedKind, onSelect }: MediaBrowserProps) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"" | MediaKind>(lockedKind ?? "");
  const [sort, setSort] = useState<(typeof sorts)[number]["value"]>("newest");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewer, setViewer] = useState<MediaListItem | null>(null);
  const [brokenThumbs, setBrokenThumbs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      const activeKind = lockedKind ?? kind;
      if (query.trim()) params.set("q", query.trim());
      if (activeKind) params.set("kind", activeKind);
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
  }, [query, kind, sort, from, to, page, revision, lockedKind]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

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
          <input
            className={styles.ltr}
            type="date"
            value={from}
            onChange={(event) => {
              setPage(1);
              setFrom(event.target.value);
            }}
          />
        </label>
        <label>
          تا تاریخ
          <input
            className={styles.ltr}
            type="date"
            value={to}
            onChange={(event) => {
              setPage(1);
              setTo(event.target.value);
            }}
          />
        </label>
      </div>

      {error ? <p className={styles.warning}>{error}</p> : null}
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
            </span>
          );
          return (
            <article key={item.id} className={styles.mediaCard}>
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
                <span>پویش: {item.scanResult === "clean" ? "سالم" : item.scanResult}</span>
              </div>
              {mode === "navigate" ? (
                <Link className="button button-dark" href={`/admin/media/${item.id}`}>
                  جزئیات
                </Link>
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
