import Link from "next/link";

import styles from "@/components/admin/Admin.module.css";
import { DeleteCheckbox, DeleteOne, DeleteSelection } from "@/components/admin/DeleteSelection";
import InboxTabs from "@/components/admin/InboxTabs";
import { requirePositionsUser } from "@/lib/auth";
import { HttpError } from "@/lib/http/errors";
import { listManagedPositions } from "@/lib/jobs/service";
import { positionStatusLabels, positionStatuses } from "@/lib/jobs/workflow";

export const dynamic = "force-dynamic";

function firstString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function listHref(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/admin/positions?${query}` : "/admin/positions";
}

export default async function PositionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePositionsUser("/admin/positions");
  const params = await searchParams;
  const status = firstString(params.status);
  const query = firstString(params.q);
  const pageParam = firstString(params.page);

  let result: Awaited<ReturnType<typeof listManagedPositions>>;
  try {
    result = await listManagedPositions(user, {
      status,
      query,
      page: pageParam && Number.isFinite(Number(pageParam)) ? Number(pageParam) : 1,
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error(error);
    return (
      <>
        <InboxTabs current="positions" />
        <div className={styles.empty}>
          پایگاه داده موقعیت‌ها در دسترس نیست. مهاجرت پایگاه داده را اجرا کنید.
        </div>
      </>
    );
  }

  const { items, page, total, totalPages, pageSize } = result;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const filterState = { status, q: query };

  return (
    <>
      <InboxTabs current="positions" />
      <div className={styles.pageHead}>
        <div>
          <h1>موقعیت‌های شغلی</h1>
          <p className={styles.meta}>
            {user.role === "admin"
              ? "مدیر وب‌سایت موقعیت را مستقیم می‌سازد، ویرایش می‌کند و منتشر می‌کند. پیشنهاد اپراتور تا تأیید مدیر در سایت دیده نمی‌شود."
              : "موقعیت تازه را پیش‌نویس کنید یا برای موقعیت منتشرشده پیشنهاد ویرایش بدهید. انتشار فقط پس از تأیید مدیر انجام می‌شود."}
          </p>
        </div>
        <Link className={styles.primaryLink} href="/admin/positions/new">
          موقعیت جدید
        </Link>
      </div>

      <form className={styles.filters} method="get">
        <select name="status" defaultValue={status ?? ""}>
          <option value="">همه وضعیت‌ها</option>
          {positionStatuses.map((value) => (
            <option key={value} value={value}>
              {positionStatusLabels[value]}
            </option>
          ))}
        </select>
        <input name="q" defaultValue={query ?? ""} placeholder="جستجو عنوان، شهر یا نشانی" />
        <input type="hidden" name="page" value="1" />
        <button className="button button-brand" type="submit">
          فیلتر
        </button>
        {user.role === "admin" ? (
          <Link href="/admin/positions?status=pending_review">صف تأیید</Link>
        ) : null}
      </form>

      <p className={styles.meta}>
        {total === 0
          ? "موقعیتی مطابق این فیلتر نیست."
          : `نمایش ${from.toLocaleString("fa-IR")} تا ${to.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")} موقعیت`}
      </p>

      {items.length === 0 ? (
        <div className={styles.empty}>
          {user.role === "operator"
            ? "هنوز موقعیت یا پیشنهادی نساخته‌اید."
            : "هنوز موقعیتی برای نمایش نیست."}
        </div>
      ) : user.role === "admin" ? (
        <DeleteSelection kind="position" ids={items.map((item) => item.id)}>
          <PositionTable items={items} canDelete />
        </DeleteSelection>
      ) : (
        <PositionTable items={items} canDelete={false} />
      )}

      {totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="صفحه‌بندی موقعیت‌ها">
          {page > 1 ? (
            <Link href={listHref({ ...filterState, page: String(page - 1) })}>
              صفحه قبل
            </Link>
          ) : (
            <span>صفحه قبل</span>
          )}
          <strong>
            صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
          </strong>
          {page < totalPages ? (
            <Link href={listHref({ ...filterState, page: String(page + 1) })}>
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

function PositionTable({
  items,
  canDelete,
}: {
  items: Awaited<ReturnType<typeof listManagedPositions>>["items"];
  canDelete: boolean;
}) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {canDelete ? <th>انتخاب</th> : null}
            <th>عنوان</th>
            <th>نوع همکاری</th>
            <th>شهر</th>
            <th>وضعیت</th>
            <th>پیشنهاددهنده</th>
            <th>به‌روزرسانی</th>
            {canDelete ? <th>حذف</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {canDelete ? (
                <td>
                  <DeleteCheckbox id={item.id} />
                </td>
              ) : null}
              <td>
                <Link href={`/admin/positions/${item.id}`}>{item.title}</Link>
                <div className={styles.subline}>
                  {item.isProposal
                    ? `پیشنهاد ویرایش${item.supersedesTitle ? ` · ${item.supersedesTitle}` : ""}`
                    : item.slug}
                </div>
              </td>
              <td>{item.employmentType}</td>
              <td>{item.city}</td>
              <td>
                <span className={styles.badge} data-status={item.status}>
                  {positionStatusLabels[item.status]}
                </span>
              </td>
              <td>{item.authorName}</td>
              <td>
                {item.updatedAt.toLocaleString("fa-IR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </td>
              {canDelete ? (
                <td>
                  <DeleteOne kind="position" id={item.id} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
