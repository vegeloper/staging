"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

import {
  Article,
  articleHref,
} from "@/lib/articles";

import styles from "./LatestArticles.module.css";

type LatestArticlesProps = {
  title?: string;
  searchPlaceholder?: string;
  allLabel?: string;
  seeAllLabel?: string;
  seeAllHref?: string;
  featuredCount?: number;
  compact?: boolean;
  articles: Article[];
  categories?: readonly string[];
};

const defaultCategories = ["همه", "مقالات", "راهنما", "اطلاعیه", "اخبار"] as const;

/* ========================================
   Normalize Search Text
======================================== */

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("fa-IR")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ========================================
   Component
======================================== */

export default function LatestArticles({
  title = "آخرین مطالب:",
  searchPlaceholder = "جستجو...",
  allLabel = "همه",
  seeAllLabel = "همه مطالب",
  seeAllHref = "/blog",
  featuredCount = 3,
  compact = false,
  articles,
  categories = defaultCategories,
}: LatestArticlesProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState<string>(allLabel);

  /* ========================================
     Filter Articles
  ======================================== */

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    return articles.filter((article) => {
      /* Category */

      const matchesCategory =
        category === allLabel ||
        article.category === category;

      if (!matchesCategory) {
        return false;
      }

      /* Empty Search */

      if (!normalizedQuery) {
        return true;
      }

      /* Full Article Text */

      const bodyText = article.body
        .map((block) => block.text)
        .join(" ");

      /* Searchable Content */

      const searchableText = normalizeSearchText(
        [
          article.title,
          article.category,
          article.date ?? "",
          bodyText,
        ].join(" "),
      );

      return searchableText.includes(normalizedQuery);
    });
  }, [articles, query, category, allLabel]);

  /* ========================================
     Featured / Rest
  ======================================== */

  const showFeatured =
    !compact && featuredCount > 0;

  const featured = showFeatured
    ? filtered.slice(0, featuredCount)
    : [];

  const rest = showFeatured
    ? filtered.slice(featuredCount)
    : filtered;

  return (
    <section
      className={styles.section}
      dir="rtl"
      aria-label={title}
    >
      {/* ========================================
          Toolbar
      ======================================== */}

      <div className={styles.toolbar}>
        {/* Search */}

        <label className={styles.search}>
          <Search
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
          />

          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            autoComplete="off"
          />
        </label>

        {/* Filters */}

        <div
          className={styles.filters}
          role="tablist"
          aria-label="دسته‌بندی مطالب"
        >
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              className={`${styles.chip} ${
                category === item
                  ? styles.chipActive
                  : ""
              }`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================
          Heading
      ======================================== */}

      <div className={styles.heading}>
        <h2 className={styles.title}>
          {title}
        </h2>

        <Link
          className={styles.seeAll}
          href={seeAllHref}
        >
          {seeAllLabel}

          <Image
            src="/figma/arrow/arrow-rightSide.svg"
            alt=""
            width={16}
            height={16}
            unoptimized
            className={styles.seeAllArrow}
          />
        </Link>
      </div>

      {/* ========================================
          Empty State
      ======================================== */}

      {filtered.length === 0 ? (
        <p className={styles.empty}>
          مطلبی مطابق جستجوی شما پیدا نشد.
        </p>
      ) : (
        <>
          {/* ========================================
              Featured Articles
          ======================================== */}

          {featured.length > 0 && (
            <ul className={styles.featuredGrid}>
              {featured.map((article) => (
                <li key={article.id}>
                  <Link
                    className={styles.card}
                    href={articleHref(article)}
                  >
                    {/* Image */}

                    <span
                      className={styles.cardImageWrap}
                    >
                      <Image
                        src={article.image.src}
                        alt={article.image.alt}
                        fill
                        unoptimized
                        sizes="(max-width: 900px) 100vw, 32vw"
                        className={styles.cardImage}
                        style={
                          article.image.objectPosition
                            ? {
                                objectPosition:
                                  article.image
                                    .objectPosition,
                              }
                            : undefined
                        }
                      />
                    </span>

                    {/* Meta */}

                    <span className={styles.cardMeta}>
                      <span className={styles.badge}>
                        {article.category}
                      </span>

                      {article.date && (
                        <>
                          <span
                            className={styles.metaDash}
                            aria-hidden="true"
                          />

                          <span
                            className={styles.cardDate}
                          >
                            {article.date}
                          </span>
                        </>
                      )}
                    </span>

                    {/* Title */}

                    <h3 className={styles.cardTitle}>
                      {article.title}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* ========================================
              Articles List
          ======================================== */}

          {rest.length > 0 && (
            <ul className={styles.list}>
              {rest.map((article) => (
                <li
                  key={article.id}
                  className={styles.listItem}
                >
                  <Link
                    className={styles.item}
                    href={articleHref(article)}
                  >
                    {/* Thumbnail */}

                    <Image
                      src={article.image.src}
                      alt={article.image.alt}
                      width={72}
                      height={72}
                      unoptimized
                      className={styles.thumb}
                    />

                    {/* Content */}

                    <span className={styles.itemCopy}>
                      <span className={styles.badge}>
                        {article.category}
                      </span>

                      <span
                        className={styles.itemTitle}
                      >
                        {article.title}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}