import { articles, type Article, type ArticleBlock } from "@/lib/articles";

import { extraCatalog } from "./extra-catalog";

import type { ContentCategory, ContentKind } from "./workflow";

const featuredSlugs = [
  "tehran-fleet-expansion",
  "electric-hybrid-fleet-employment",
  "route-destination-marketing",
  "online-trips",
  "electric-hybrid-taxi-pollution",
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
  homeLead: boolean;
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
  const seeded = articles.map((article, index) => {
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
      homeLead: false,
      sortOrder: featuredIndex >= 0 ? featuredIndex : 100 + index,
    };
  });
  return [...seeded, ...extraCatalog];
}

export type PublicArticle = Article & {
  kind: ContentKind;
  featured: boolean;
  homeLead: boolean;
  publishedAtMs: number;
  createdAtMs: number;
  updatedAtMs: number;
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
    homeLead: item.homeLead,
    publishedAtMs: 0,
    createdAtMs: index,
    updatedAtMs: index,
    sortOrder: item.sortOrder ?? index,
  };
}

export function orderByAddedThenModified(items: PublicArticle[]) {
  if (items.length === 0) return [];
  const byId = (left: PublicArticle, right: PublicArticle) =>
    left.id.localeCompare(right.id);
  const chosen = items
    .filter((item) => item.homeLead)
    .sort((left, right) => right.updatedAtMs - left.updatedAtMs || byId(left, right))[0];
  const lead = chosen ?? [...items].sort((left, right) => {
    const created = right.createdAtMs - left.createdAtMs;
    if (created !== 0) return created;
    const updated = right.updatedAtMs - left.updatedAtMs;
    if (updated !== 0) return updated;
    return byId(left, right);
  })[0];
  const rest = items
    .filter((item) => item.id !== lead.id)
    .sort((left, right) => {
      const updated = right.updatedAtMs - left.updatedAtMs;
      if (updated !== 0) return updated;
      const created = right.createdAtMs - left.createdAtMs;
      if (created !== 0) return created;
      return byId(left, right);
    });
  return [lead, ...rest];
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
