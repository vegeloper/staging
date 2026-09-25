import { articles, type Article, type ArticleBlock } from "@/lib/articles";

import type { ContentCategory, ContentKind } from "./workflow";

const featuredSlugs = [
  "online-trips",
  "fifty-thousand",
  "weight-update",
  "support-guide",
  "org-guide",
];

export type CatalogSeed = {
  slug: string;
  kind: ContentKind;
  category: ContentCategory;
  title: string;
  displayDate: string;
  commentsLabel: string;
  likesLabel: string;
  imageSrc: string;
  imageAlt: string;
  imageObjectPosition: string | null;
  body: ArticleBlock[];
  featured: boolean;
  sortOrder: number;
};

export function normalizeCategory(category: string): ContentCategory {
  if (category === "مقاله" || category === "مقالات") return "مقالات";
  if (category === "راهنما" || category === "اطلاعیه" || category === "اخبار") {
    return category;
  }
  return "مقالات";
}

export function kindForCategory(category: ContentCategory): ContentKind {
  return category === "اخبار" || category === "اطلاعیه" ? "news" : "article";
}

export function starterCatalog(): CatalogSeed[] {
  return articles.map((article, index) => {
    const category = normalizeCategory(article.category);
    const featuredIndex = featuredSlugs.indexOf(article.id);
    return {
      slug: article.id,
      kind: kindForCategory(category),
      category,
      title: article.title,
      displayDate: article.date ?? "",
      commentsLabel: article.comments ?? "",
      likesLabel: article.likes ?? "",
      imageSrc: article.image.src,
      imageAlt: article.image.alt,
      imageObjectPosition: article.image.objectPosition ?? null,
      body: article.body,
      featured: featuredIndex >= 0,
      sortOrder: featuredIndex >= 0 ? featuredIndex : 100 + index,
    };
  });
}

export type PublicArticle = Article & {
  kind: ContentKind;
  featured: boolean;
  publishedAtMs: number;
  sortOrder: number;
};

export function seedToPublic(item: CatalogSeed, index = 0): PublicArticle {
  return {
    id: item.slug,
    category: item.category,
    title: item.title,
    date: item.displayDate,
    comments: item.commentsLabel,
    likes: item.likesLabel,
    image: {
      src: item.imageSrc,
      alt: item.imageAlt,
      objectPosition: item.imageObjectPosition ?? undefined,
    },
    body: item.body,
    kind: item.kind,
    featured: item.featured,
    publishedAtMs: 0,
    sortOrder: item.sortOrder ?? index,
  };
}

export function fallbackFeeds() {
  const published = starterCatalog().map(seedToPublic);
  return arrangeFeeds(published);
}

export function arrangeFeeds(published: PublicArticle[]) {
  const byRecency = (left: PublicArticle, right: PublicArticle) => {
    const time = right.publishedAtMs - left.publishedAtMs;
    if (time !== 0) return time;
    return left.sortOrder - right.sortOrder;
  };
  const featured = published.filter((item) => item.featured);
  return {
    popular: featured.length > 0 ? featured : published.slice(0, 5),
    articles: published.filter((item) => item.kind === "article").sort(byRecency),
    news: published.filter((item) => item.kind === "news").sort(byRecency),
  };
}

export function relatedArticles(list: PublicArticle[], id: string) {
  const others = list.filter((item) => item.id !== id);
  const featured = others.filter((item) => item.featured);
  const rest = others.filter((item) => !item.featured);
  return [...featured, ...rest].slice(0, 3);
}
