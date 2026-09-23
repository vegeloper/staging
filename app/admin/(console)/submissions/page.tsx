import Link from "next/link";

import { AttachmentBadge } from "@/components/admin/AttachmentBadge";
import styles from "@/components/admin/Admin.module.css";
import {
  submissionStatusLabels,
  submissionTypeLabels,
  submissionStatuses,
  submissionTypes,
  safeDisplayText,
} from "@/lib/forms";
import { requireInboxUser } from "@/lib/auth";
import { listSubmissions } from "@/lib/submissions/service";

export const dynamic = "force-dynamic";

function firstString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function inboxHref(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/admin/submissions?${query}` : "/admin/submissions";
}

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireInboxUser();
  const params = await searchParams;
  const type = firstString(params.type);
  const status = firstString(params.status);
  const query = firstString(params.q);
  const hasAttachmentParam = firstString(params.hasAttachment);
  const sortParam = firstString(params.sort);
  const pageParam = firstString(params.page);
  const sort = sortParam === "oldest" ? "oldest" : "newest";
  const hasAttachment =
    hasAttachmentParam === "yes" ? true : hasAttachmentParam === "no" ? false : undefined;

  const { items, page, total, totalPages, pageSize } = await listSubmissions({
    type: submissionTypes.includes(type as never) ? (type as never) : undefined,
    status: submissionStatuses.includes(status as never)
      ? (status as never)
      : undefined,
    query,
    hasAttachment,
    sort,
    page: pageParam && Number.isFinite(Number(pageParam)) ? Number(pageParam) : 1,
  });

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const filterState = {
    type,
    status,
    q: query,
    hasAttachment: hasAttachmentParam,
    sort,
  };

  return (
    <>
      <h1>درخواست‌های دریافتی</h1>
      <form className={styles.filters} method="get">
        <select name="type" defaultValue={type ?? ""}>
          <option value="">همه انواع</option>
          {submissionTypes.map((value) => (
            <option key={value} value={value}>
              {submissionTypeLabels[value]}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""}>
          <option value="">همه وضعیت‌ها</option>
          {submissionStatuses.map((value) => (
            <option key={value} value={value}>
              {submissionStatusLabels[value]}
            </option>
          ))}
        </select>
        <select name="hasAttachment" defaultValue={hasAttachmentParam ?? ""}>
          <option value="">همه پیوست‌ها</option>
          <option value="yes">دارای پیوست / رزومه</option>
          <option value="no">بدون پیوست</option>
        </select>
        <select name="sort" defaultValue={sort}>
          <option value="newest">جدیدترین ابتدا</option>
          <option value="oldest">قدیمی‌ترین ابتدا</option>
        </select>
        <input name="q" defaultValue={query ?? ""} placeholder="جستجو نام، موبایل یا ایمیل" />
        <input type="hidden" name="page" value="1" />
        <button className="button button-brand" type="submit">
          فیلتر
        </button>
      </form>

      <p className={styles.meta}>
        {total === 0
          ? "هنوز درخواستی مطابق فیلترها نیست."
          : `نمایش ${from.toLocaleString("fa-IR")} تا ${to.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")} درخواست`}
      </p>

      {items.length === 0 ? (
        <div className={styles.empty}>هنوز درخواستی ثبت نشده است.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>پیوست</th>
                <th>نوع</th>
                <th>نام</th>
                <th>تماس</th>
                <th>وضعیت</th>
                <th>زمان دریافت</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <AttachmentBadge
                      kind={item.attachmentKind}
                      fileName={safeDisplayText(item.attachmentName, "")}
                    />
                  </td>
                  <td>{submissionTypeLabels[item.type]}</td>
                  <td>
                    <Link href={`/admin/submissions/${item.id}`}>
                      {safeDisplayText(item.name)}
                    </Link>
                    {item.brand ? (
                      <div className={styles.subline}>{safeDisplayText(item.brand)}</div>
                    ) : null}
                  </td>
                  <td>
                    <div>{safeDisplayText(item.phone)}</div>
                    {item.email ? (
                      <div className={styles.subline}>{safeDisplayText(item.email)}</div>
                    ) : null}
                  </td>
                  <td>
                    <span className={styles.badge}>
                      {submissionStatusLabels[item.status]}
                    </span>
                  </td>
                  <td>
                    {item.createdAt.toLocaleString("fa-IR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="صفحه‌بندی درخواست‌ها">
          {page > 1 ? (
            <Link href={inboxHref({ ...filterState, page: String(page - 1) })}>
              صفحه قبل
            </Link>
          ) : (
            <span>صفحه قبل</span>
          )}
          <strong>
            صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
          </strong>
          {page < totalPages ? (
            <Link href={inboxHref({ ...filterState, page: String(page + 1) })}>
              صفحه بعد
            </Link>
          ) : (
            <span>صفحه بعد</span>
          )}
        </nav>
      ) : null}
    </>
  );
}
