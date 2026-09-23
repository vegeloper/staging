import type { StaticImageData } from "next/image";

import {
  type Article,
  articleHref,
} from "@/lib/articles";

/* ========================================
   News Item
======================================== */

export type HomeNewsItem = {
  id: string;

  title: string;

  description?: string;

  date?: string;

  category?: string;

  image: string | StaticImageData;

  imageAlt?: string;

  href: string;

  buttonText?: string;
};

/* ========================================
   Get Article Description
======================================== */

function getArticleDescription(
  article: Article,
  maxLength = 180,
): string | undefined {
  const firstParagraph = article.body.find(
    (block) => block.type === "p",
  );

  if (!firstParagraph) {
    return undefined;
  }

  const text = firstParagraph.text.trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text
    .slice(0, maxLength)
    .trim()}...`;
}

/* ========================================
   Article -> Home News Item
======================================== */

export function articleToHomeNews(
  article: Article,
  options?: {
    withDescription?: boolean;
  },
): HomeNewsItem {
  return {
    id: article.id,

    title: article.title,

    description:
      options?.withDescription
        ? getArticleDescription(article)
        : undefined,

    date: article.date,

    category: article.category,

    image: article.image.src,

    imageAlt: article.image.alt,

    href: articleHref(article),

    buttonText:
      article.category === "اخبار"
        ? "مشاهده خبر"
        : "مشاهده مطلب",
  };
}

/* ========================================
   Homepage News
======================================== */
export function getHomepageNews(
  articles: Article[],
  count = 5,
) {
  const selectedArticles =
    articles.slice(0, count);

  const [
    featuredArticle,
    ...sideArticles
  ] = selectedArticles;

  if (!featuredArticle) {
    return null;
  }

  return {
    featuredNews:
      articleToHomeNews(
        featuredArticle,
        {
          withDescription: true,
        },
      ),

    newsData:
      sideArticles.map((article) =>
        articleToHomeNews(
          article,
          {
            withDescription: true,
          },
        ),
      ),
  };
}