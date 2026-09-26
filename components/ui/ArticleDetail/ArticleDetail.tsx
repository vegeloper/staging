"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  articleHref,
  type Article,
} from "@/lib/articles";
import RichText from "@/components/ui/RichText";

import styles from "./ArticleDetail.module.css";

type ArticleDetailProps = {
  article: Article;
  related?: Article[];
  relatedTitle?: string;
  backHref?: string;
  backLabel?: string;
};

export default function ArticleDetail({
  article,
  related = [],
  relatedTitle = "مطالب محبوب:",
  backHref,
  backLabel = "بازگشت",
}: ArticleDetailProps) {
  const router = useRouter();

  const hasMeta =
    article.date ||
    article.comments ||
    article.likes;

  return (
    <article
      className={styles.section}
      dir="rtl"
    >
      {/* ========================================
          Header
      ======================================== */}

      <header className={styles.header}>
        {/* Back */}

        {backHref ? (
          <Link href={backHref} className={styles.back} aria-label={backLabel}>
            <Image
              src="/figma/arrow/backArrow.svg"
              alt=""
              width={20}
              height={20}
              unoptimized
              className={styles.backArrow}
            />

            {backLabel}
          </Link>
        ) : (
          <button
            type="button"
            className={styles.back}
            onClick={() => router.back()}
            aria-label={backLabel}
          >
            <Image
              src="/figma/arrow/backArrow.svg"
              alt=""
              width={20}
              height={20}
              unoptimized
              className={styles.backArrow}
            />

            {backLabel}
          </button>
        )}

        {/* Category */}

        <span className={styles.badge}>
          {article.category}
        </span>

        {/* Title */}

        <h1 className={styles.title}>
          {article.title}
        </h1>

        {/* Meta */}

        {hasMeta && (
          <div className={styles.metaRow}>
            <div className={styles.meta}>
              <span
                className={styles.metaDash}
                aria-hidden="true"
              />

              {article.date && (
                <span>
                  <Image
                    src="/figma/svgs/small-icons/calendar.svg"
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                  />

                  {article.date}
                </span>
              )}

              {article.comments && (
                <span>
                  <Image
                    src="/figma/svgs/small-icons/chat.svg"
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                  />

                  {article.comments}
                </span>
              )}

              {article.likes && (
                <span>
                  <Image
                    src="/figma/svgs/small-icons/heart.svg"
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                  />

                  {article.likes}
                </span>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ========================================
          Hero Image
      ======================================== */}

      <div className={styles.hero}>
        <Image
          src={article.image.src}
          alt={article.image.alt}
          fill
          unoptimized
          priority
          sizes="(max-width: 900px) 100vw, 1280px"
          className={styles.heroImage}
          style={
            article.image.objectPosition
              ? {
                  objectPosition:
                    article.image.objectPosition,
                }
              : undefined
          }
        />
      </div>

      {/* ========================================
          Content
      ======================================== */}

      <div className={styles.layout}>
        {/* Article Body */}

        <div className={styles.body}>
          {article.body.map((block, index) => {
            const key = `${block.type}-${index}`;
            const content = <RichText text={block.text} />;
            if (block.type === "title") {
              return (
                <p key={key} className={styles.bodyTitle}>
                  {content}
                </p>
              );
            }
            if (block.type === "h2") return <h2 key={key}>{content}</h2>;
            if (block.type === "h3") return <h3 key={key}>{content}</h3>;
            if (block.type === "h4") return <h4 key={key}>{content}</h4>;
            if (block.type === "h5") return <h5 key={key}>{content}</h5>;
            return <p key={key}>{content}</p>;
          })}
        </div>

        {/* ========================================
            Related Articles
        ======================================== */}

        {related.length > 0 && (
          <aside
            className={styles.aside}
            aria-label={relatedTitle}
          >
            <h2
              className={styles.asideTitle}
            >
              {relatedTitle}
            </h2>

            <ul className={styles.list}>
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    className={styles.item}
                    href={articleHref(item)}
                  >
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      width={72}
                      height={72}
                      unoptimized
                      className={styles.thumb}
                    />

                    <span
                      className={styles.itemCopy}
                    >
                      <span
                        className={`${styles.itemBadge} ${
                          item.category === "اخبار"
                            ? styles.itemBadgeGhost
                            : ""
                        }`}
                      >
                        {item.category}
                      </span>

                      <span
                        className={styles.itemTitle}
                      >
                        {item.title}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </article>
  );
}