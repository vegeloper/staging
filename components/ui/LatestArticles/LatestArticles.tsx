"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

import styles from "./LatestArticles.module.css";

export type LatestArticle = {
  id: string;
  category: string;
  title: string;
  date: string;
  href?: string;
  image: {
    src: string;
    alt: string;
    objectPosition?: string;
  };
};

type LatestArticlesProps = {
  title?: string;
  searchPlaceholder?: string;
  allLabel?: string;
  seeAllLabel?: string;
  seeAllHref?: string;
  featuredCount?: number;
  compact?: boolean;
  articles?: LatestArticle[];
  categories?: readonly string[];
};

const defaultCategories = ["همه", "مقالات", "راهنما", "اطلاعیه", "اخبار"] as const;

const defaultArticles: LatestArticle[] = [
  {
    id: "online-trips",
    category: "مقالات",
    title: "سفرهای آنلاین چه تأثیری بر زندگی مردم گذاشته است؟",
    date: "۲ ساعت پیش",
    image: {
      src: "/figma/png/passenger-insideCar.jpg",
      alt: "مسافر در حال استفاده از اپلیکیشن دات‌وان تریپ",
      objectPosition: "center 18%",
    },
  },
  {
    id: "intercity",
    category: "اخبار",
    title: "دات‌وان تریپ سفر بین شهری را به خدمات خود اضافه کرد.",
    date: "۱ هفته پیش",
    image: {
      src: "/figma/png/cars-insideCabin.png",
      alt: "کابین هوشمند خودروی دات‌وان تریپ",
      objectPosition: "center 80%",
    },
  },
  {
    id: "city-trip-guide",
    category: "راهنما",
    title: "راهنمای درخواست سفر شهری",
    date: "۱ شهریور ۱۴۰۵",
    image: {
      src: "/figma/png/mobilephone.png",
      alt: "درخواست سفر شهری روی موبایل",
    },
  },
  {
    id: "org-guide",
    category: "راهنما",
    title: "راهنمای استفاده از خدمات سازمانی",
    date: "۵ مرداد ۱۴۰۵",
    image: {
      src: "/figma/png/mobilephone.png",
      alt: "استفاده از خدمات سازمانی روی موبایل",
    },
  },
  {
    id: "fifty-thousand",
    category: "اخبار",
    title: "آمار نشان می‌دهد که دات‌وان تریپ بیش از ۵۰ هزار سفر موفق داشته است",
    date: "۲۴ مرداد ۱۴۰۵",
    image: {
      src: "/figma/png/driver-backneck.png",
      alt: "راننده دات‌وان تریپ در مسیر",
    },
  },
  {
    id: "online-taxi",
    category: "اخبار",
    title: "دات‌وان تریپ، تجربه‌ای متفاوت از تاکسی‌های آنلاین را عرضه می‌کند",
    date: "۲۰ مرداد ۱۴۰۵",
    image: {
      src: "/figma/png/cars-navy.jpg",
      alt: "ناوگان دات‌وان تریپ",
    },
  },
  {
    id: "support-guide",
    category: "راهنما",
    title: "راهنمای ثبت درخواست پشتیبانی",
    date: "۱۲ مرداد ۱۴۰۵",
    image: {
      src: "/figma/png/callCenter.png",
      alt: "پشتیبانی دات‌وان تریپ",
    },
  },
  {
    id: "lorestan",
    category: "اطلاعیه",
    title: "از ۲۹ آذر دات‌وان تریپ در لرستان شروع به خدمت‌رسانی می‌کند",
    date: "۱۰ مرداد ۱۴۰۵",
    image: {
      src: "/figma/png/information.png",
      alt: "تابلوی اطلاع‌رسانی",
    },
  },
  {
    id: "weight-update",
    category: "اطلاعیه",
    title: "آپدیت وزن ۵.۴ دات‌وان تریپ عرضه شد.",
    date: "۱۸ مرداد ۱۴۰۵",
    image: {
      src: "/figma/png/information.png",
      alt: "تابلوی اطلاع‌رسانی",
    },
  },
];

export default function LatestArticles({
  title = "آخرین مطالب:",
  searchPlaceholder = "جستجو...",
  allLabel = "همه",
  seeAllLabel = "همه مطالب",
  seeAllHref = "#",
  featuredCount = 3,
  compact = false,
  articles = defaultArticles,
  categories = defaultCategories,
}: LatestArticlesProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(allLabel);

  const filtered = useMemo(() => {
    const needle = query.trim();
    return articles.filter((article) => {
      const matchesCategory =
        category === allLabel || article.category === category;
      const matchesQuery =
        !needle ||
        article.title.includes(needle) ||
        article.category.includes(needle) ||
        article.date.includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [allLabel, articles, category, query]);

  const showFeatured = !compact && featuredCount > 0;
  const featured = showFeatured ? filtered.slice(0, featuredCount) : [];
  const rest = showFeatured ? filtered.slice(featuredCount) : filtered;

  return (
    <section className={styles.section} dir="rtl" aria-label={title}>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={20} strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </label>

        <div className={styles.filters} role="tablist" aria-label="دسته‌بندی مطالب">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              className={`${styles.chip} ${
                category === item ? styles.chipActive : ""
              }`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.heading}>
        <h2 className={styles.title}>{title}</h2>
        <a className={styles.seeAll} href={seeAllHref}>
          {seeAllLabel}
          <Image
            src="/figma/arrow/arrow-rightSide.svg"
            alt=""
            width={16}
            height={16}
            unoptimized
            className={styles.seeAllArrow}
          />
        </a>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>مطلبی مطابق جستجوی شما پیدا نشد.</p>
      ) : (
        <>
          {featured.length > 0 ? (
            <ul className={styles.featuredGrid}>
              {featured.map((article) => (
                <li key={article.id}>
                  <Link className={styles.card} href={article.href ?? `/blog/${article.id}`}>
                    <span className={styles.cardImageWrap}>
                      <Image
                        src={article.image.src}
                        alt={article.image.alt}
                        fill
                        unoptimized
                        sizes="(max-width: 900px) 100vw, 32vw"
                        className={styles.cardImage}
                        style={
                          article.image.objectPosition
                            ? { objectPosition: article.image.objectPosition }
                            : undefined
                        }
                      />
                    </span>
                    <span className={styles.cardMeta}>
                      <span className={styles.badge}>{article.category}</span>
                      <span className={styles.metaDash} aria-hidden="true" />
                      <span className={styles.cardDate}>{article.date}</span>
                    </span>
                    <h3 className={styles.cardTitle}>{article.title}</h3>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {rest.length > 0 ? (
            <ul className={styles.list}>
              {rest.map((article) => (
                <li key={article.id} className={styles.listItem}>
                  <Link className={styles.item} href={article.href ?? `/blog/${article.id}`}>
                    <Image
                      src={article.image.src}
                      alt=""
                      width={72}
                      height={72}
                      unoptimized
                      className={styles.thumb}
                    />
                    <span className={styles.itemCopy}>
                      <span className={styles.badge}>{article.category}</span>
                      <span className={styles.itemTitle}>{article.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </section>
  );
}
