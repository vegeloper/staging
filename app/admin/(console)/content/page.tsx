import Link from "next/link";

import styles from "@/components/admin/Admin.module.css";
import { DeleteCheckbox, DeleteOne, DeleteSelection } from "@/components/admin/DeleteSelection";
import { requireCmsUser } from "@/lib/auth";
import { HttpError } from "@/lib/http/errors";
import { listManagedContent } from "@/lib/cms/service";
import {
  contentKindLabels,
  contentKinds,
  contentStatusLabels,
  contentStatuses,
} from "@/lib/cms/workflow";

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
  return query ? `/admin/content?${query}` : "/admin/content";
}

export default async function ContentListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireCmsUser("/admin/content");
  const params = await searchParams;
  const kind = firstString(params.kind);
  const status = firstString(params.status);
  const query = firstString(params.q);
  const pageParam = firstString(params.page);

  let result: Awaited<ReturnType<typeof listManagedContent>>;
  try {
    result = await listManagedContent(user, {
      kind,
      status,
      query,
      page: pageParam && Number.isFinite(Number(pageParam)) ? Number(pageParam) : 1,
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error(error);
    return (
      <div className={styles.empty}>
        پایگاه داده مطالب در دسترس نیست. مهاجرت پایگاه داده را اجرا کنید.
      </div>
    );
  }

  const { items, page, total, totalPages, pageSize } = result;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const filterState = { kind, status, q: query };

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1>مطالب و اخبار</h1>
          <p className={styles.meta}>
            تولیدکننده محتوا پیش‌نویس می‌سازد و مدیر وب‌سایت آن را تأیید یا رد می‌کند.
            فقط مطالب تأییدشده در صفحه وبلاگ دیده می‌شوند.
          </p>
        </div>
        <Link className={styles.primaryLink} href="/admin/content/new">
          مطلب جدید
        </Link>
      </div>

      <form className={styles.filters} method="get">
        <select name="kind" defaultValue={kind ?? ""}>
          <option value="">همه نوع‌ها</option>
          {contentKinds.map((value) => (
            <option key={value} value={value}>
              {contentKindLabels[value]}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""}>
          <option value="">همه وضعیت‌ها</option>
          {contentStatuses.map((value) => (
            <option key={value} value={value}>
              {contentStatusLabels[value]}
            </option>
          ))}
        </select>
        <input name="q" defaultValue={query ?? ""} placeholder="جستجو عنوان یا نشانی" />
        <input type="hidden" name="page" value="1" />
        <button className="button button-brand" type="submit">
          فیلتر
        </button>
      </form>

      <p className={styles.meta}>
        {total === 0
          ? "مطلبی مطابق این فیلتر نیست."
          : `نمایش ${from.toLocaleString("fa-IR")} تا ${to.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")} مطلب`}
      </p>

      {items.length === 0 ? (
        <div className={styles.empty}>
          {user.role === "content_creator"
            ? "هنوز مطلبی نساخته‌اید."
            : "هنوز مطلبی برای نمایش نیست."}
        </div>
      ) : user.role === "admin" ? (
        <DeleteSelection kind="content" ids={items.map((item) => item.id)}>
          <ContentTable items={items} canDelete />
        </DeleteSelection>
      ) : (
        <ContentTable items={items} canDelete={false} />
      )}

      {totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="صفحه‌بندی مطالب">
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

function ContentTable({
  items,
  canDelete,
}: {
  items: Awaited<ReturnType<typeof listManagedContent>>["items"];
  canDelete: boolean;
}) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {canDelete ? <th>انتخاب</th> : null}
            <th>عنوان</th>
            <th>نوع</th>
            <th>دسته</th>
            <th>وضعیت</th>
            <th>نویسنده</th>
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
                <Link href={`/admin/content/${item.id}`}>{item.title}</Link>
                <div className={styles.subline}>{item.slug}</div>
              </td>
              <td>{contentKindLabels[item.kind]}</td>
              <td>{item.category}</td>
              <td>
                <span className={styles.badge} data-status={item.status}>
                  {contentStatusLabels[item.status]}
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
                  <DeleteOne kind="content" id={item.id} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
