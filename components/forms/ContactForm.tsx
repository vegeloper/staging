"use client";

import { useState } from "react";
import type {
  FieldErrors,
  FieldPath,
  FieldValues,
  UseFormSetError,
} from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Mail, MapPin, Phone, Send } from "lucide-react";

import {
  contactCategoryLabels,
  contactFieldsSchema,
  type ContactFormFields,
} from "@/lib/forms";

import { Field, Honeypot, SuccessState, useIdempotencyKey } from "./FormShell";

import styles from "./ContactForm.module.css";

/* ========================================
   API
======================================== */

async function submitJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    fields?: Record<string, string>;
  };

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

/* ========================================
   Server errors
======================================== */

export function applyServerFieldErrors<T extends FieldValues>(
  fields: Record<string, string> | undefined,
  setError: UseFormSetError<T>,
) {
  if (!fields) return;

  for (const [name, message] of Object.entries(fields)) {
    setError(name as FieldPath<T>, {
      type: "server",
      message,
    });
  }
}

export function firstError(errors: FieldErrors) {
  const first = Object.values(errors)[0];

  if (!first) return "";

  if (typeof first.message === "string") {
    return first.message;
  }

  return "";
}

/* ========================================
   Contact Form
======================================== */

export default function ContactForm() {
  const { ensure } = useIdempotencyKey("contact");

  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState("");

  const form = useForm<ContactFormFields>({
    resolver: zodResolver(contactFieldsSchema),

    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      category: undefined,
      message: "",
    },
  });

  return (
    <section id="contact" className={styles.section} dir="rtl">
      <div className={styles.container}>
        {/* ========================================
            Form
        ======================================== */}

        <div className={styles.formSide}>
          {done ? (
            <div className={styles.successWrapper}>
              <SuccessState
                title="درخواست شما ثبت شد"
                body="همکاران ما در اولین فرصت با شما تماس می‌گیرند."
              />
            </div>
          ) : (
            <form
              className={styles.form}
              onSubmit={form.handleSubmit(
                async (values) => {
                  setFormError("");

                  const result = await submitJson("/api/forms/contact", {
                    ...values,
                    idempotencyKey: ensure(),
                    website: "",
                  });

                  if (result.ok) {
                    setDone(true);
                    return;
                  }

                  applyServerFieldErrors(result.data.fields, form.setError);

                  setFormError(
                    result.data.error || "ارسال نشد، دوباره تلاش کنید.",
                  );
                },

                (errors) => {
                  const first = Object.values(errors)[0];

                  const message =
                    first && typeof first === "object" && "message" in first
                      ? String(first.message)
                      : "اطلاعات فرم را کامل کنید.";

                  setFormError(message);
                },
              )}
              noValidate
            >
              <Honeypot />

              {/* ========================================
                  First row
              ======================================== */}

              <div className={styles.fieldsGrid}>
                <Field
                  label="نام"
                  error={form.formState.errors.firstName?.message}
                >
                  <input
                    className={styles.control}
                    placeholder="نام خود را وارد کنید"
                    autoComplete="given-name"
                    {...form.register("firstName")}
                  />
                </Field>

                <Field
                  label="نام خانوادگی"
                  error={form.formState.errors.lastName?.message}
                >
                  <input
                    className={styles.control}
                    placeholder="نام خانوادگی خود را وارد کنید"
                    autoComplete="family-name"
                    {...form.register("lastName")}
                  />
                </Field>

                {/* ========================================
                    Second row
                ======================================== */}
                <Field
                  label="شماره تماس"
                  error={form.formState.errors.phone?.message}
                >
                  <input
                    className={`${styles.control} ${styles.phoneInput}`}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="شماره خود را وارد کنید"
                    {...form.register("phone")}
                  />
                </Field>

                <Field
                  label="ایمیل"
                  error={form.formState.errors.email?.message}
                >
                  <input
                    className={styles.control}
                    type="email"
                    dir="rtl"
                    placeholder="ایمیل خود را وارد کنید"
                    autoComplete="email"
                    {...form.register("email")}
                  />
                </Field>
              </div>

              {/* ========================================
                  Category
              ======================================== */}

              <div className={styles.categorySection}>
                {form.formState.errors.category?.message && (
                  <p className={styles.fieldError}>
                    {form.formState.errors.category.message}
                  </p>
                )}

                <div
                  className={styles.categories}
                  role="radiogroup"
                  aria-label="نوع درخواست"
                >
                  {Object.entries(contactCategoryLabels).map(
                    ([value, label]) => (
                      <label className={styles.radioLabel} key={value}>
                        <input
                          type="radio"
                          value={value}
                          className={styles.radioInput}
                          {...form.register("category")}
                        />

                        <span
                          className={styles.radioVisual}
                          aria-hidden="true"
                        />

                        <span>{label}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              {/* ========================================
                  Message
              ======================================== */}

              <div className={styles.messageField}>
                <Field
                  label="پیام"
                  error={form.formState.errors.message?.message}
                >
                  <textarea
                    className={styles.textarea}
                    placeholder="پیام خود را در این قسمت برای ما بنویسید"
                    maxLength={450}
                    {...form.register("message")}
                  />
                </Field>

                <span className={styles.counter}>
                  {form.watch("message")?.length ?? 0}/۴۵۰
                </span>
              </div>

              {/* ========================================
                  Form Error
              ======================================== */}

              {formError && <p className={styles.formError}>{formError}</p>}

              {/* ========================================
                  Submit
              ======================================== */}

              <div className={styles.actions}>
                <button
                  className={styles.submitButton}
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  <Send size={15} strokeWidth={1.8} aria-hidden="true" />

                  <span>
                    {form.formState.isSubmitting ? "در حال ارسال..." : "ارسال"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ========================================
            Contact Card
        ======================================== */}

        <aside className={styles.contactCard}>
          <div className={styles.contactHeader}>
            <h2>با ما در تماس باشید</h2>

            <p>
              شما می‌توانید از طریق ایمیل، شبکه‌های مجازی، شماره تلفن و یا با پر
              کردن فرم روبرو با ما در ارتباط باشید.
            </p>
          </div>

          <div className={styles.contactItems}>
            <a href="tel:+982100000000" className={styles.contactItem}>
              <Phone size={20} strokeWidth={1.5} aria-hidden="true" />

              <span>۰۲۱۴۲۱۰۱</span>
            </a>

            <a href="mailto:trip@dotone.ir" className={styles.contactItem}>
              <Mail size={20} strokeWidth={1.5} aria-hidden="true" />

              <span dir="ltr">trip@dotone.ir</span>
            </a>

            <div className={styles.contactItem}>
              <MapPin size={21} strokeWidth={1.5} aria-hidden="true" />

              <span>
                تهران، چهارراه جهان کودک، برج دات‌وان،
                <br />
                طبقه ششم
              </span>
            </div>
          </div>

          {/* decorative circles */}
          <span className={styles.circleOne} aria-hidden="true" />

          <span className={styles.circleTwo} aria-hidden="true" />
        </aside>
      </div>
    </section>
  );
}

export { submitJson };
