import Image, {
  type StaticImageData,
} from "next/image";
import Link from "next/link";

import styles from "./NewsSection.module.css";

export type NewsItem = {
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

type NewsSectionProps = {
  eyebrow?: string;

  title?: string;

  description?: string;

  featuredNews: NewsItem;

  news: NewsItem[];

  allNewsHref?: string;

  allNewsLabel?: string;
};

export default function NewsSection({
  eyebrow = "اخبار و رویدادها",

  title = "دات‌وان تریپ در مسیر توسعه",

  description = "آخرین اخبار، رویدادها و اتفاقات دات‌وان تریپ را دنبال کنید.",

  featuredNews,

  news,

  allNewsHref,

  allNewsLabel = "مشاهده همه اخبار",
}: NewsSectionProps) {
  return (
    <section
      className={styles.section}
      dir="rtl"
    >
      <div className={styles.container}>
        {/* ========================================
            Heading
        ======================================== */}

        <header className={styles.heading}>
          {eyebrow && (
            <span className={styles.eyebrow}>
              {eyebrow}
            </span>
          )}

          {title && (
            <h2 className={styles.sectionTitle}>
              {title}
            </h2>
          )}

          {description && (
            <p
              className={
                styles.sectionDescription
              }
            >
              {description}
            </p>
          )}
        </header>

        {/* ========================================
            News Layout
        ======================================== */}

        <div className={styles.newsLayout}>
          {/* ========================================
              Featured News
          ======================================== */}

          <article
            className={styles.featuredCard}
          >
            {/* Featured Image */}

            <Link
              href={featuredNews.href}
              className={
                styles.featuredImageLink
              }
              aria-label={featuredNews.title}
            >
              <div
                className={
                  styles.featuredImageWrapper
                }
              >
                <Image
                  src={featuredNews.image}
                  alt={
                    featuredNews.imageAlt ??
                    featuredNews.title
                  }
                  fill
                  priority
                  className={
                    styles.featuredImage
                  }
                  sizes="(max-width: 768px) 92vw, 52vw"
                />
              </div>
            </Link>

            {/* Featured Content */}

            <div
              className={
                styles.featuredContent
              }
            >
              <h3
                className={
                  styles.featuredTitle
                }
              >
                <Link
                  href={featuredNews.href}
                >
                  {featuredNews.title}
                </Link>
              </h3>

              {featuredNews.description && (
                <p
                  className={
                    styles.featuredDescription
                  }
                >
                  {
                    featuredNews.description
                  }
                </p>
              )}

              {/* فقط دکمه - بدون تاریخ و Category */}

              <div
                className={
                  styles.featuredFooter
                }
              >
                <Link
                  href={featuredNews.href}
                  className={
                    styles.newsButton
                  }
                >
                  {featuredNews.buttonText ??
                    "مشاهده مطلب"}
                </Link>
              </div>
            </div>
          </article>

          {/* ========================================
              Side News
          ======================================== */}

          <div className={styles.newsList}>
            {news.map((item) => (
              <article
                className={styles.newsCard}
                key={item.id}
              >
                {/* Image */}

                <Link
                  href={item.href}
                  className={
                    styles.newsImageLink
                  }
                  aria-label={item.title}
                >
                  <div
                    className={
                      styles.newsImageWrapper
                    }
                  >
                    <Image
                      src={item.image}
                      alt={
                        item.imageAlt ??
                        item.title
                      }
                      fill
                      className={
                        styles.newsImage
                      }
                      sizes="(max-width: 768px) 35vw, 16vw"
                    />
                  </div>
                </Link>

                {/* Content */}

                <div
                  className={
                    styles.newsContent
                  }
                >
                  {/* Title */}

                  <h3
                    className={
                      styles.newsTitle
                    }
                  >
                    <Link href={item.href}>
                      {item.title}
                    </Link>
                  </h3>

                  {/* Description */}

                  {item.description && (
                    <p
                      className={
                        styles.newsDescription
                      }
                    >
                      {item.description}
                    </p>
                  )}

                  {/* Footer */}

                  <div
                    className={
                      styles.newsCardFooter
                    }
                  >
                    {item.date && (
                      <span
                        className={
                          styles.newsDate
                        }
                      >
                        {item.date}
                      </span>
                    )}

                    <Link
                      href={item.href}
                      className={
                        styles.newsButton
                      }
                    >
                      {item.buttonText ??
                        "مشاهده مطلب"}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ========================================
            All News
        ======================================== */}

        {allNewsHref && (
          <div className={styles.allNews}>
            <Link
              href={allNewsHref}
              className={
                styles.allNewsButton
              }
            >
              {allNewsLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}