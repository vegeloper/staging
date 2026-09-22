import Link from "next/link";
import { notFound } from "next/navigation";

import ContentEditor from "@/components/admin/ContentEditor";
import styles from "@/components/admin/Admin.module.css";
import { requireCmsUser } from "@/lib/auth";
import { getManagedContent } from "@/lib/cms/service";
import { actionLabel, editorPermissions } from "@/lib/cms/workflow";
import { HttpError } from "@/lib/http/errors";

export const dynamic = "force-dynamic";

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCmsUser(`/admin/content/${id}`);

  let result: Awaited<ReturnType<typeof getManagedContent>>;
  try {
    result = await getManagedContent(user, id);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error(error);
    return (
      <div className={styles.empty}>
        پایگاه داده مطالب در دسترس نیست. مهاجرت پایگاه داده را اجرا کنید.
      </div>
    );
  }

  if (!result) notFound();
  const { post, history } = result;

  return (
    <>
      <Link href="/admin/content" className={styles.backButton}>
        بازگشت به مطالب
      </Link>
      <div className={styles.pageHead}>
        <h1>{post.title}</h1>
        <Link className={styles.secondaryLink} href={`/admin/content/${post.id}/preview`}>
          پیش‌نمایش
        </Link>
      </div>
      <ContentEditor
        mode="edit"
        postId={post.id}
        status={post.status}
        reviewNote={post.reviewNote}
        authorName={post.authorName}
        initial={{
          kind: post.kind,
          category: post.category,
          title: post.title,
          slug: post.slug,
          displayDate: post.displayDate,
          commentsLabel: post.commentsLabel,
          likesLabel: post.likesLabel,
          imageSrc: post.imageSrc,
          imageAlt: post.imageAlt,
          imageObjectPosition: post.imageObjectPosition,
          bodyText: post.bodyText,
          featured: post.featured,
        }}
        permissions={editorPermissions(
          { userId: user.id, role: user.role },
          { authorId: post.authorId, status: post.status },
        )}
      />

      {history.length > 0 ? (
        <section className={styles.history}>
          <h2>تاریخچه</h2>
          <ul>
            {history.map((event) => (
              <li key={event.id}>
                <strong>{actionLabel(event.action)}</strong>
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
