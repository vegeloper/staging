import Link from "next/link";
import { notFound } from "next/navigation";

import PositionEditor from "@/components/admin/PositionEditor";
import styles from "@/components/admin/Admin.module.css";
import JobDetails from "@/components/ui/join-us/JobDetails/JobDetails";
import { requirePositionsUser } from "@/lib/auth";
import { HttpError } from "@/lib/http/errors";
import { getManagedPosition } from "@/lib/jobs/service";
import { editorPermissions } from "@/lib/jobs/workflow";
import { toJobDetails } from "@/lib/jobs/present";

export const dynamic = "force-dynamic";

export default async function EditPositionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePositionsUser(`/admin/positions/${id}`);

  let result: Awaited<ReturnType<typeof getManagedPosition>>;
  try {
    result = await getManagedPosition(user, id);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error(error);
    return (
      <div className={styles.empty}>
        پایگاه داده موقعیت‌ها در دسترس نیست. مهاجرت پایگاه داده را اجرا کنید.
      </div>
    );
  }

  if (!result) notFound();
  const { position, history, openProposal } = result;

  return (
    <>
      <Link href="/admin/positions" className={styles.backButton}>
        بازگشت به موقعیت‌ها
      </Link>
      <div className={styles.pageHead}>
        <h1>{position.title}</h1>
        {position.status === "approved" && !position.supersedesId ? (
          <Link
            className={styles.secondaryLink}
            href={`/join-us/organizational/${position.slug}`}
          >
            مشاهده در سایت
          </Link>
        ) : null}
      </div>
      <PositionEditor
        mode="edit"
        positionId={position.id}
        status={position.status}
        reviewNote={position.reviewNote}
        authorName={position.authorName}
        isProposal={Boolean(position.supersedesId)}
        openProposal={openProposal}
        initial={position.form}
        permissions={editorPermissions(
          { userId: user.id, role: user.role },
          {
            authorId: position.authorId,
            status: position.status,
            supersedesId: position.supersedesId,
          },
        )}
      />

      <section className={styles.history}>
        <h2>پیش‌نمایش صفحه موقعیت</h2>
        <JobDetails
          {...toJobDetails({
            slug: position.supersedesId ? position.desiredSlug : position.slug,
            title: position.title,
            employmentType: position.employmentType,
            department: position.department,
            city: position.city,
            summary: position.summary,
            highlights: position.highlights,
            sections: position.sections,
            meta: position.meta,
          })}
        />
      </section>

      {history.length > 0 ? (
        <section className={styles.history}>
          <h2>تاریخچه</h2>
          <ul>
            {history.map((event) => (
              <li key={event.id}>
                <strong>{event.label}</strong>
                <span>
                  {event.actorName ?? "سیستم"} ·{" "}
                  {new Date(event.createdAt).toLocaleString("fa-IR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
                {event.note ? <p>{event.note}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
