import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Header from "@/components/ui/Header/Header";
import ArticleDetail from "@/components/ui/ArticleDetail/ArticleDetail";

import { getPublishedArticle } from "@/lib/cms/service";
import { articles } from "@/lib/articles";

type ArticlePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return articles.map((article) => ({
    id: article.id,
  }));
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;

  const article = (await getPublishedArticle(id))?.article;

  if (!article) {
    return {
      title: "مقاله | دات‌وان تریپ",
    };
  }

  const firstParagraph = article.body.find(
    (block) => block.type === "p",
  );

  return {
    title: `${article.title} | دات‌وان تریپ`,
    description: firstParagraph?.text,
  };
}

export default async function ArticlePage({
  params,
}: ArticlePageProps) {
  const { id } = await params;

  const published = await getPublishedArticle(id);

  if (!published) {
    notFound();
  }

  return (
    <>
      <Header variant="light" />

      <ArticleDetail
        article={published.article}
        related={published.related}
      />
    </>
  );
}