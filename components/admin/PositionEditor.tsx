"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { emptyPositionForm, type PositionFormValues } from "@/lib/jobs/input";
import {
  employmentTypes,
  positionStatusLabels,
  type PositionEditorPermissions,
  type PositionStatus,
} from "@/lib/jobs/workflow";
import styles from "./Admin.module.css";

type PositionEditorProps = {
  mode: "create" | "edit";
  positionId?: string;
  status?: PositionStatus;
  reviewNote?: string | null;
  authorName?: string;
  isProposal?: boolean;
  openProposal?: { id: string; status: PositionStatus } | null;
  initial?: PositionFormValues;
  permissions: PositionEditorPermissions;
};

export default function PositionEditor({
  mode,
  positionId,
  status,
  reviewNote,
  authorName,
  isProposal = false,
  openProposal = null,
  initial = emptyPositionForm,
  permissions,
}: PositionEditorProps) {
  const router = useRouter();
  const [values, setValues] = useState<PositionFormValues>(initial);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  const disabled = pending || !permissions.canEdit;

  function update<K extends keyof PositionFormValues>(key: K, value: PositionFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function send(action: string) {
    if (action === "unpublish" && !window.confirm("این موقعیت از سایت برداشته شود؟")) {
      return;
    }
    if (action === "reject" && note.trim().length < 2) {
      setError("دلیل رد را بنویسید.");
      return;
    }

    setPending(true);
    setError("");
    setFields({});

    const sendsPosition = permissions.canEdit && action !== "withdraw";
    const response = await fetch(
      mode === "create" ? "/api/admin/positions" : `/api/admin/positions/${positionId}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note: action === "reject" ? note : undefined,
          position: sendsPosition ? values : undefined,
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
      setError(data.error || "ذخیره موقعیت انجام نشد.");
      setFields(data.fields ?? {});
      return;
    }

    if (data.id && (mode === "create" || data.id !== positionId)) {
      router.push(`/admin/positions/${data.id}`);
      router.refresh();
      return;
    }

    setNote("");
    router.refresh();
  }

  async function propose() {
    setPending(true);
    setError("");
    const response = await fetch("/api/admin/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "propose", sourceId: positionId }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      id?: string;
    };
    setPending(false);
    if (!response.ok || !data.id) {
      setError(data.error || "پیشنهاد ویرایش ساخته نشد.");
      return;
    }
    router.push(`/admin/positions/${data.id}`);
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
          وضعیت: {positionStatusLabels[status]}
          {authorName ? ` · پیشنهاددهنده: ${authorName}` : ""}
        </p>
      ) : (
        <p className={styles.meta}>
          {permissions.canPublish
            ? "مدیر وب‌سایت می‌تواند این موقعیت را مستقیم منتشر کند."
            : "پیش‌نویس تا وقتی مدیر وب‌سایت آن را تأیید نکند در سایت دیده نمی‌شود."}
        </p>
      )}

      {isProposal ? (
        <p className={styles.note}>
          این پیشنهاد پس از تأیید مدیر روی موقعیت منتشرشده اعمال می‌شود. تا قبل از تأیید،
          صفحه فرصت‌های شغلی همان نسخه فعلی را نشان می‌دهد.
        </p>
      ) : null}
      {status === "approved" && permissions.canEdit ? (
        <p className={styles.note}>ذخیره کردن، نسخه عمومی سایت را همین حالا به‌روز می‌کند.</p>
      ) : null}
      {status === "rejected" && reviewNote ? (
        <p className={styles.warning}>دلیل رد: {reviewNote}</p>
      ) : null}
      {status === "pending_review" ? (
        <p className={styles.note}>این موقعیت منتظر تأیید یا رد مدیر وب‌سایت است.</p>
      ) : null}
      {openProposal ? (
        <p className={styles.note}>
          یک پیشنهاد ویرایش {positionStatusLabels[openProposal.status]} برای این موقعیت وجود دارد.{" "}
          <a href={`/admin/positions/${openProposal.id}`}>مشاهده پیشنهاد</a>
        </p>
      ) : null}

      <div className={styles.formGrid}>
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
          نشانی
          <input
            className={styles.ltr}
            value={values.slug}
            disabled={disabled}
            placeholder="frontend-developer"
            onChange={(event) => update("slug", event.target.value.trim().toLowerCase())}
          />
          {fields.slug ? <small>{fields.slug}</small> : null}
        </label>

        <label>
          نوع همکاری
          <select
            value={values.employmentType}
            disabled={disabled}
            onChange={(event) =>
              update("employmentType", event.target.value as PositionFormValues["employmentType"])
            }
          >
            {employmentTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          واحد
          <input
            value={values.department}
            disabled={disabled}
            onChange={(event) => update("department", event.target.value)}
          />
          {fields.department ? <small>{fields.department}</small> : null}
        </label>

        <label>
          شهر
          <input
            value={values.city}
            disabled={disabled}
            onChange={(event) => update("city", event.target.value)}
          />
          {fields.city ? <small>{fields.city}</small> : null}
        </label>

        <label className={styles.span2}>
          خلاصه
          <textarea
            value={values.summary}
            disabled={disabled}
            rows={3}
            onChange={(event) => update("summary", event.target.value)}
          />
          {fields.summary ? <small>{fields.summary}</small> : null}
        </label>

        <label>
          برجسته‌ها
          <textarea
            value={values.highlightsText}
            disabled={disabled}
            rows={4}
            placeholder={"هر مورد در یک خط"}
            onChange={(event) => update("highlightsText", event.target.value)}
          />
          {fields.highlightsText ? <small>{fields.highlightsText}</small> : null}
        </label>

        <label>
          هدف شغل
          <textarea
            value={values.goalText}
            disabled={disabled}
            rows={4}
            onChange={(event) => update("goalText", event.target.value)}
          />
        </label>

        <label>
          شرح وظایف
          <textarea
            value={values.responsibilitiesText}
            disabled={disabled}
            rows={6}
            placeholder={"هر وظیفه در یک خط"}
            onChange={(event) => update("responsibilitiesText", event.target.value)}
          />
          {fields.responsibilitiesText ? <small>{fields.responsibilitiesText}</small> : null}
        </label>

        <label>
          شرایط
          <textarea
            value={values.requirementsText}
            disabled={disabled}
            rows={6}
            placeholder={"هر شرط در یک خط"}
            onChange={(event) => update("requirementsText", event.target.value)}
          />
        </label>

        <label className={styles.span2}>
          مشخصات
          <textarea
            value={values.metaText}
            disabled={disabled}
            rows={5}
            placeholder={"نوع همکاری | تمام وقت\nشهر | تهران"}
            onChange={(event) => update("metaText", event.target.value)}
          />
          {fields.metaText ? <small>{fields.metaText}</small> : null}
        </label>

        <label>
          ترتیب نمایش
          <input
            type="number"
            min={0}
            max={9999}
            value={values.sortOrder}
            disabled={disabled}
            onChange={(event) => update("sortOrder", Number(event.target.value))}
          />
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
        {permissions.canPropose ? (
          <button
            className="button button-brand"
            type="button"
            disabled={pending}
            onClick={() => void propose()}
          >
            {openProposal ? "ادامه پیشنهاد ویرایش" : "پیشنهاد ویرایش"}
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
            توضیح برای اپراتور
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
