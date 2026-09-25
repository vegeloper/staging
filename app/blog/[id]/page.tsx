import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Header from "@/components/ui/Header/Header";
import ArticleDetail from "@/components/ui/ArticleDetail/ArticleDetail";
import { getPublishedArticle } from "@/lib/cms/service";

type ArticlePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublishedArticle(id);

  if (!result) {
    return {
      title: "مقاله | دات‌وان تریپ",
    };
  }

  const firstParagraph = result.article.body.find(
    (block) => block.type === "p",
  );

  return {
    title: `${result.article.title} | دات‌وان تریپ`,
    description: firstParagraph?.text,
  };
}

export default async function ArticlePage({
  params,
}: ArticlePageProps) {
  const { id } = await params;
  const result = await getPublishedArticle(id);

  if (!result) {
    notFound();
  }

  return (
    <>
      <Header variant="light" />
      <ArticleDetail article={result.article} related={result.related} />
    </>
  );
}