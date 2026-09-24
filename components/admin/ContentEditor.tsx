"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { contentImages } from "@/lib/cms/images";
import MediaField from "./MediaField";
import ResetIconButton from "./ResetIconButton";
import ShamsiDateField from "./ShamsiDateField";
import { emptyContentForm, type ContentFormValues } from "@/lib/cms/input";
import {
  categoriesForKind,
  contentKindLabels,
  contentStatusLabels,
  type ContentStatus,
  type EditorPermissions,
} from "@/lib/cms/workflow";
import styles from "./Admin.module.css";

type ContentEditorProps = {
  mode: "create" | "edit";
  postId?: string;
  status?: ContentStatus;
  reviewNote?: string | null;
  authorName?: string;
  initial?: ContentFormValues;
  permissions: EditorPermissions;
};

export default function ContentEditor({
  mode,
  postId,
  status,
  reviewNote,
  authorName,
  initial = emptyContentForm,
  permissions,
}: ContentEditorProps) {
  const router = useRouter();
  const [values, setValues] = useState<ContentFormValues>(initial);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  const categories = categoriesForKind(values.kind);
  const disabled = pending || !permissions.canEdit;

  function update<K extends keyof ContentFormValues>(key: K, value: ContentFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function send(action: string) {
    if (action === "unpublish" && !window.confirm("این مطلب از سایت برداشته شود؟")) {
      return;
    }
    if (action === "reject" && note.trim().length < 2) {
      setError("دلیل رد را بنویسید.");
      return;
    }

    setPending(true);
    setError("");
    setFields({});

    const sendsPost = permissions.canEdit && action !== "withdraw";
    const response = await fetch(
      mode === "create" ? "/api/admin/content" : `/api/admin/content/${postId}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note: action === "reject" ? note : undefined,
          post: sendsPost ? values : undefined,
        }),
      },
    );
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      fields?: Record<string, string>;
      id?: string;
    };
    setPending(false);

    if (!response.ok) {
      setError(data.error || "ذخیره مطلب انجام نشد.");
      setFields(data.fields ?? {});
      return;
    }

    if (mode === "create" && data.id) {
      router.push(`/admin/content/${data.id}`);
      router.refresh();
      return;
    }

    setNote("");
    router.refresh();
  }

  return (
    <form
      className={styles.editor}
      onSubmit={(event) => {
        event.preventDefault();
        if (permissions.canEdit) void send("save");
      }}
    >
      {status ? (
        <p className={styles.meta}>
          وضعیت: {contentStatusLabels[status]}
          {authorName ? ` · نویسنده: ${authorName}` : ""}
        </p>
      ) : (
        <p className={styles.meta}>
          پیش‌نویس تا وقتی مدیر وب‌سایت آن را تأیید نکند در سایت دیده نمی‌شود.
        </p>
      )}

      {status === "approved" && permissions.canEdit ? (
        <p className={styles.note}>ذخیره کردن، نسخه عمومی سایت را همین حالا به‌روز می‌کند.</p>
      ) : null}
      {status === "rejected" && reviewNote ? (
        <p className={styles.warning}>دلیل رد: {reviewNote}</p>
      ) : null}
      {status === "pending_review" ? (
        <p className={styles.note}>این مطلب منتظر تأیید یا رد مدیر وب‌سایت است.</p>
      ) : null}

      <div className={styles.formGrid}>
        <label>
          نوع
          <select
            value={values.kind}
            disabled={disabled}
            onChange={(event) => {
              const kind = event.target.value as ContentFormValues["kind"];
              const allowed = categoriesForKind(kind);
              setValues((current) => ({
                ...current,
                kind,
                category: allowed.includes(current.category) ? current.category : allowed[0],
              }));
            }}
          >
            {Object.entries(contentKindLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          دسته
          <select
            value={values.category}
            disabled={disabled}
            onChange={(event) =>
              update("category", event.target.value as ContentFormValues["category"])
            }
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {fields.category ? <small>{fields.category}</small> : null}
        </label>

        <label className={styles.span2}>
          عنوان
          <input
            value={values.title}
            disabled={disabled}
            onChange={(event) => update("title", event.target.value)}
          />
          {fields.title ? <small>{fields.title}</small> : null}
        </label>

        <label>
          URL slug
          <span className={styles.inputShell}>
            <input
              className={styles.ltr}
              value={values.slug}
              disabled={disabled}
              placeholder="city-trip-guide"
              onChange={(event) => update("slug", event.target.value.trim().toLowerCase())}
            />
            <ResetIconButton label="Reset URL slug" disabled={disabled} onClick={() => update("slug", emptyContentForm.slug)} />
          </span>
          {fields.slug ? <small>{fields.slug}</small> : null}
        </label>

        <label>
          تاریخ نمایش
          <ShamsiDateField
            mode="text"
            value={values.displayDate}
            disabled={disabled}
            onChange={(displayDate) => update("displayDate", displayDate)}
          />
          {fields.displayDate ? <small>{fields.displayDate}</small> : null}
        </label>

        <label>
          تصویر آماده
          <select
            value={contentImages.some((image) => image.src === values.imageSrc) ? values.imageSrc : ""}
            disabled={disabled}
            onChange={(event) => update("imageSrc", event.target.value)}
          >
            <option value="" disabled>
              از کتابخانه یا بارگذاری
            </option>
            {contentImages.map((image) => (
              <option key={image.src} value={image.src}>
                {image.label}
              </option>
            ))}
          </select>
          {fields.imageSrc ? <small>{fields.imageSrc}</small> : null}
        </label>
        <div className={styles.span2}>
          <MediaField
            label="تصویر مطلب"
            kind="image"
            value={values.imageSrc}
            disabled={disabled}
            hint="از کتابخانه، کشیدن فایل، یا انتخاب از رایانه"
            onChange={(src) => update("imageSrc", src)}
          />
        </div>

        <label>
          توضیح تصویر
          <input
            value={values.imageAlt}
            disabled={disabled}
            onChange={(event) => update("imageAlt", event.target.value)}
          />
          {fields.imageAlt ? <small>{fields.imageAlt}</small> : null}
        </label>

        <label>
          Image focal point
          <span className={styles.inputShell}>
            <input
              className={styles.ltr}
              value={values.imageObjectPosition}
              disabled={disabled}
              placeholder="center 18%"
              onChange={(event) => update("imageObjectPosition", event.target.value)}
            />
            <ResetIconButton
              label="Reset image focal point"
              disabled={disabled}
              onClick={() => update("imageObjectPosition", emptyContentForm.imageObjectPosition)}
            />
          </span>
        </label>

        <label>
          Comment count
          <span className={styles.inputShell}>
            <input
              value={values.commentsLabel}
              disabled={disabled}
              onChange={(event) => update("commentsLabel", event.target.value)}
            />
            <ResetIconButton
              label="Reset comment count"
              disabled={disabled}
              onClick={() => update("commentsLabel", emptyContentForm.commentsLabel)}
            />
          </span>
        </label>

        <label>
          Like count
          <span className={styles.inputShell}>
            <input
              value={values.likesLabel}
              disabled={disabled}
              onChange={(event) => update("likesLabel", event.target.value)}
            />
            <ResetIconButton
              label="Reset like count"
              disabled={disabled}
              onClick={() => update("likesLabel", emptyContentForm.likesLabel)}
            />
          </span>
        </label>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={values.featured}
            disabled={disabled}
            onChange={(event) => update("featured", event.target.checked)}
          />
          در فهرست مطالب محبوب نمایش داده شود
        </label>

        <label className={styles.span2}>
          متن
          <textarea
            value={values.bodyText}
            disabled={disabled}
            rows={14}
            placeholder={"هر بند را با یک خط خالی جدا کنید.\nبرای تیتر، بند را با ## شروع کنید."}
            onChange={(event) => update("bodyText", event.target.value)}
          />
          {fields.bodyText ? <small>{fields.bodyText}</small> : null}
        </label>
      </div>

      {error ? <p className={styles.warning}>{error}</p> : null}

      <div className={styles.formActions}>
        {permissions.canEdit ? (
          <button className="button button-dark" type="submit" disabled={pending}>
            {status === "approved" ? "ذخیره تغییرات" : "ذخیره پیش‌نویس"}
          </button>
        ) : null}
        {permissions.canSubmit && !permissions.canPublish ? (
          <button
            className="button button-brand"
            type="button"
            disabled={pending}
            onClick={() => void send("submit")}
          >
            {status === "rejected" ? "ارسال دوباره برای تأیید" : "ارسال برای تأیید"}
          </button>
        ) : null}
        {permissions.canPublish && status !== "pending_review" ? (
          <button
            className="button button-brand"
            type="button"
            disabled={pending}
            onClick={() => void send("publish")}
          >
            انتشار
          </button>
        ) : null}
        {permissions.canWithdraw ? (
          <button
            className="button button-dark"
            type="button"
            disabled={pending}
            onClick={() => void send("withdraw")}
          >
            پس گرفتن
          </button>
        ) : null}
        {permissions.canUnpublish ? (
          <button
            className="button button-dark"
            type="button"
            disabled={pending}
            onClick={() => void send("unpublish")}
          >
            خروج از انتشار
          </button>
        ) : null}
      </div>

      {permissions.canApprove || permissions.canReject ? (
        <section className={styles.reviewBox}>
          <h2>بررسی مدیر</h2>
          <label>
            توضیح برای تولیدکننده محتوا
            <textarea
              value={note}
              rows={3}
              onChange={(event) => setNote(event.target.value)}
              placeholder="در صورت رد کردن، دلیل را بنویسید."
            />
          </label>
          <div className={styles.formActions}>
            {permissions.canApprove ? (
              <button
                className="button button-brand"
                type="button"
                disabled={pending}
                onClick={() => void send("approve")}
              >
                تأیید و انتشار
              </button>
            ) : null}
            {permissions.canReject ? (
              <button
                className="button button-dark"
                type="button"
                disabled={pending}
                onClick={() => void send("reject")}
              >
                رد کردن
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </form>
  );
}
