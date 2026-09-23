import Link from "next/link";
import { notFound } from "next/navigation";

import ArticleDetail from "@/components/ui/ArticleDetail/ArticleDetail";
import styles from "@/components/admin/Admin.module.css";
import { requireCmsUser } from "@/lib/auth";
import { parseBody } from "@/lib/cms/body";
import { getManagedContent } from "@/lib/cms/service";
import { contentStatusLabels } from "@/lib/cms/workflow";
import { HttpError } from "@/lib/http/errors";

export const dynamic = "force-dynamic";

export default async function ContentPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCmsUser(`/admin/content/${id}/preview`);

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
  const { post } = result;

  return (
    <>
      <Link href={`/admin/content/${post.id}`} className={styles.backButton}>
        بازگشت به ویرایش
      </Link>
      <p className={post.status === "approved" ? styles.note : styles.warning}>
        {post.status === "approved"
          ? "این نسخه روی سایت منتشر شده است."
          : `پیش‌نمایش داخلی است و برای بازدیدکنندگان دیده نمی‌شود. وضعیت: ${contentStatusLabels[post.status]}`}
      </p>
      <ArticleDetail
        article={{
          id: post.slug,
          category: post.category,
          title: post.title,
          date: post.displayDate,
          comments: post.commentsLabel,
          likes: post.likesLabel,
          image: {
            src: post.imageSrc,
            alt: post.imageAlt,
            objectPosition: post.imageObjectPosition || undefined,
          },
          body: parseBody(post.bodyText),
        }}
        backHref={`/admin/content/${post.id}`}
        backLabel="بازگشت به ویرایش"
      />
    </>
  );
}
