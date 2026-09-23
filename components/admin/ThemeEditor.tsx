"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { builtinMedia, defaultTheme, type SiteTheme } from "@/lib/site/defaults";
import MediaField from "./MediaField";
import styles from "./Admin.module.css";

type ThemeEditorProps = {
  initial: SiteTheme;
  revision: number;
  publishedAt: string | null;
  assets: string[];
};

const colorFields: Array<{ key: keyof SiteTheme["colors"]; label: string }> = [
  { key: "brand", label: "رنگ اصلی" },
  { key: "brandDark", label: "رنگ اصلی تیره" },
  { key: "ink", label: "رنگ متن" },
  { key: "paper", label: "رنگ زمینه" },
  { key: "surface", label: "رنگ سطح کارت‌ها" },
  { key: "hero", label: "رنگ تأکید" },
];

const imageFields: Array<{ key: keyof SiteTheme["media"]; label: string; hint: string }> = [
  { key: "logo", label: "لوگوی سربرگ تیره", hint: builtinMedia.logo },
  { key: "logoFooter", label: "لوگوی سربرگ روشن", hint: builtinMedia.logoFooter },
  { key: "footerLogo", label: "لوگوی پاورقی", hint: builtinMedia.footerLogo },
  { key: "heroImage", label: "تصویر بخش شروع سفر", hint: builtinMedia.heroImage },
  { key: "campaignPoster", label: "پوستر ویدیوی کمپین", hint: builtinMedia.campaignPoster },
];

export default function ThemeEditor({ initial, revision, publishedAt, assets }: ThemeEditorProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<SiteTheme>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  function setColor(key: keyof SiteTheme["colors"], value: string) {
    setTheme((current) => ({ ...current, colors: { ...current.colors, [key]: value } }));
  }

  function setMedia(key: keyof SiteTheme["media"], value: string) {
    setTheme((current) => ({ ...current, media: { ...current.media, [key]: value } }));
  }

  async function send(action: "save" | "publish") {
    setPending(true);
    setError("");
    setMessage("");
    setFields({});
    const response = await fetch("/api/admin/site/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, document: theme }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      fields?: Record<string, string>;
    };
    setPending(false);
    if (!response.ok) {
      setError(data.error || "ذخیره پوسته ناموفق بود.");
      setFields(data.fields ?? {});
      return;
    }
    setMessage(
      action === "publish"
        ? "پوسته منتشر شد و روی سایت عمومی اعمال می‌شود. کانتینر دوباره راه‌اندازی نمی‌شود."
        : "پیش‌نویس ذخیره شد. سایت عمومی هنوز نسخه منتشرشده را نشان می‌دهد.",
    );
    router.refresh();
  }

  return (
    <div className={styles.editor}>
      <p className={styles.meta}>
        نسخه منتشرشده: {revision.toLocaleString("fa-IR")}
        {publishedAt
          ? ` · ${new Date(publishedAt).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })}`
          : " · هنوز منتشر نشده"}
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>پالت رنگ</h2>
        <div className={styles.swatches} aria-hidden="true">
          {colorFields.map((field) => (
            <span
              key={field.key}
              className={styles.swatch}
              style={{ background: theme.colors[field.key] }}
              title={field.label}
            />
          ))}
        </div>
        <div className={styles.formGrid}>
          {colorFields.map((field) => (
            <label key={field.key}>
              {field.label}
              <span className={styles.colorRow}>
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(theme.colors[field.key]) ? theme.colors[field.key] : "#000000"}
                  onChange={(event) => setColor(field.key, event.target.value)}
                  aria-label={`${field.label} — انتخاب رنگ`}
                />
                <input
                  className={styles.ltr}
                  value={theme.colors[field.key]}
                  onChange={(event) => setColor(field.key, event.target.value)}
                  spellCheck={false}
                  aria-label={field.label}
                />
              </span>
              {fields[`colors.${field.key}`] ? <small>{fields[`colors.${field.key}`]}</small> : null}
            </label>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>تصاویر</h2>
        <p className={styles.meta}>
          هر تصویر را بکشید و رها کنید، از رایانه انتخاب کنید، یا از کتابخانه رسانه بردارید. خالی یعنی فایل پیش‌فرض. بارگذاریِ قبول‌شده به کتابخانه هم اضافه می‌شود.
        </p>
        <div className={styles.formGrid}>
          <MediaField
            label="تصویر پس‌زمینه"
            kind="image"
            value={theme.background.image}
            hint="خالی = بدون تصویر"
            assets={assets}
            onChange={(image) => setTheme((current) => ({ ...current, background: { image } }))}
          />
          {fields["background.image"] ? <small className={styles.span2}>{fields["background.image"]}</small> : null}
          {imageFields.map((field) => (
            <div key={field.key} className={styles.span2}>
              <MediaField
                label={field.label}
                kind="image"
                value={theme.media[field.key]}
                hint={`خالی = ${field.hint}`}
                assets={assets}
                onChange={(value) => setMedia(field.key, value)}
              />
              {fields[`media.${field.key}`] ? <small>{fields[`media.${field.key}`]}</small> : null}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ویدیو</h2>
        <p className={styles.meta}>ویدیوی صفحه کمپین جدا از تصاویر پوسته است. پوستر همان ویدیو در بخش تصاویر قرار دارد.</p>
        <div className={styles.formGrid}>
          <MediaField
            label="ویدیوی صفحه کمپین"
            kind="video"
            value={theme.media.campaignVideo}
            hint={`خالی = ${builtinMedia.campaignVideo}`}
            assets={assets}
            onChange={(value) => setMedia("campaignVideo", value)}
          />
          {fields["media.campaignVideo"] ? <small className={styles.span2}>{fields["media.campaignVideo"]}</small> : null}
        </div>
      </section>

      {error ? <p className={styles.warning}>{error}</p> : null}
      {message ? <p className={styles.note}>{message}</p> : null}
      <div className={styles.formActions}>
        <button className="button button-dark" type="button" disabled={pending} onClick={() => setTheme(structuredClone(defaultTheme))}>
          بازنشانی فرم
        </button>
        <button className="button button-dark" type="button" disabled={pending} onClick={() => send("save")}>
          ذخیره پیش‌نویس
        </button>
        <button className="button button-brand" type="button" disabled={pending} onClick={() => send("publish")}>
          {pending ? "در حال انتشار..." : "انتشار پوسته"}
        </button>
      </div>
    </div>
  );
}
