"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import styles from "./PopularArticles.module.css";

export type PopularArticle = {
  id: string;
  category: string;
  title: string;
  date: string;
  comments: string;
  likes: string;
  href?: string;
  image: {
    src: string;
    alt: string;
    objectPosition?: string;
  };
};

type PopularArticlesProps = {
  title?: string;
  articles?: PopularArticle[];
};

const defaultArticles: PopularArticle[] = [
  {
    id: "online-trips",
    category: "مقالات",
    title: "سفرهای آنلاین چه تأثیری بر زندگی مردم گذاشته است؟",
    date: "۱ شهریور ۱۴۰۵",
    comments: "۱۰",
    likes: "۱.۵k",
    image: {
      src: "/figma/png/passenger-insideCar.jpg",
      alt: "مسافر در حال استفاده از اپلیکیشن دات‌وان تریپ",
      objectPosition: "center 18%",
    },
  },
  {
    id: "fifty-thousand",
    category: "اخبار",
    title: "آمار نشان می‌دهد که دات‌وان تریپ بیش از ۵۰ هزار سفر موفق داشته است",
    date: "۲۴ مرداد ۱۴۰۵",
    comments: "۸",
    likes: "۹۲۰",
    image: {
      src: "/figma/png/driver-backneck.png",
      alt: "راننده دات‌وان تریپ در مسیر",
    },
  },
  {
    id: "weight-update",
    category: "اطلاعیه",
    title: "آپدیت وزن ۵.۴ دات‌وان تریپ عرضه شد.",
    date: "۱۸ مرداد ۱۴۰۵",
    comments: "۴",
    likes: "۶۱۰",
    image: {
      src: "/figma/png/information.png",
      alt: "تابلوی اطلاع‌رسانی",
    },
  },
  {
    id: "support-guide",
    category: "راهنما",
    title: "راهنمای ثبت درخواست پشتیبانی",
    date: "۱۲ مرداد ۱۴۰۵",
    comments: "۶",
    likes: "۴۴۰",
    image: {
      src: "/figma/png/callCenter.png",
      alt: "پشتیبانی دات‌وان تریپ",
    },
  },
  {
    id: "org-guide",
    category: "راهنما",
    title: "راهنمای استفاده از خدمات سازمانی",
    date: "۵ مرداد ۱۴۰۵",
    comments: "۳",
    likes: "۳۸۰",
    image: {
      src: "/figma/png/mobilephone.png",
      alt: "استفاده از خدمات سازمانی روی موبایل",
    },
  },
];

export default function PopularArticles({
  title = "مطالب محبوب:",
  articles = defaultArticles,
}: PopularArticlesProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (articles.length === 0) return null;

  const featured = articles[activeIndex];
  const goTo = (index: number) => {
    const last = articles.length - 1;
    if (index < 0) setActiveIndex(last);
    else if (index > last) setActiveIndex(0);
    else setActiveIndex(index);
  };

  return (
    <section className={styles.section} dir="rtl" aria-label={title}>
      <div className={styles.layout}>
        <aside className={styles.aside}>
          <h2 className={styles.title}>{title}</h2>

          <ul className={styles.list}>
            {articles.map((article, index) => (
              <li key={article.id}>
                <button
                  type="button"
                  className={`${styles.item} ${
                    index === activeIndex ? styles.itemActive : ""
                  }`}
                  onClick={() => setActiveIndex(index)}
                  aria-current={index === activeIndex ? "true" : undefined}
                >
                  <Image
                    src={article.image.src}
                    alt=""
                    width={72}
                    height={72}
                    unoptimized
                    className={styles.thumb}
                  />
                  <span className={styles.itemCopy}>
                    <span className={styles.itemBadge}>{article.category}</span>
                    <span className={styles.itemTitle}>{article.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className={styles.featuredCol}>
          <div className={styles.nav} dir="ltr">
            <button
              type="button"
              className={`${styles.navButton} ${styles.navPrev}`}
              onClick={() => goTo(activeIndex - 1)}
              aria-label="مطلب قبلی"
            >
              <Image
                src="/figma/arrow/arrow-leftSide.svg"
                alt=""
                width={20}
                height={20}
                unoptimized
              />
            </button>
            <button
              type="button"
              className={`${styles.navButton} ${styles.navNext}`}
              onClick={() => goTo(activeIndex + 1)}
              aria-label="مطلب بعدی"
            >
              <Image
                src="/figma/arrow/arrow-rightSide.svg"
                alt=""
                width={20}
                height={20}
                unoptimized
              />
            </button>
          </div>

          <Link className={styles.featured} href={featured.href ?? `/blog/${featured.id}`}>
            <Image
              src={featured.image.src}
              alt={featured.image.alt}
              fill
              unoptimized
              sizes="(max-width: 900px) 100vw, 68vw"
              className={styles.featuredImage}
              style={
                featured.image.objectPosition
                  ? { objectPosition: featured.image.objectPosition }
                  : undefined
              }
            />
            <div className={styles.overlay}>
              <div className={styles.featuredCopy}>
                <span className={styles.badge}>{featured.category}</span>
                <h3 className={styles.featuredTitle}>{featured.title}</h3>
              </div>
              <div className={styles.meta}>
                <span className={styles.metaDash} aria-hidden="true" />
                <span>
                  <Image
                    src="/figma/svgs/small-icons/calendar.svg"
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                  />
                  {featured.date}
                </span>
                <span>
                  <Image
                    src="/figma/svgs/small-icons/chat.svg"
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                  />
                  {featured.comments}
                </span>
                <span>
                  <Image
                    src="/figma/svgs/small-icons/heart.svg"
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                  />
                  {featured.likes}
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
