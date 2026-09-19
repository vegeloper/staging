import Image from "next/image";
import Link from "next/link";

import { articleHref, type Article } from "@/lib/articles";
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
  backHref = "/blog",
  backLabel = "بازگشت",
}: ArticleDetailProps) {
  return (
    <article className={styles.section} dir="rtl">
      <header className={styles.header}>
        <Link className={styles.back} href={backHref}>
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

        <span className={styles.badge}>{article.category}</span>
        <h1 className={styles.title}>{article.title}</h1>

        <div className={styles.metaRow}>
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
              {article.date}
            </span>
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
          </div>
        </div>
      </header>

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
              ? { objectPosition: article.image.objectPosition }
              : undefined
          }
        />
      </div>

      <div className={styles.layout}>
        <div className={styles.body}>
          {article.body.map((block, index) =>
            block.type === "h2" ? (
              <h2 key={`${block.type}-${index}`}>{block.text}</h2>
            ) : (
              <p key={`${block.type}-${index}`}>{block.text}</p>
            ),
          )}
        </div>

        {related.length > 0 ? (
          <aside className={styles.aside} aria-label={relatedTitle}>
            <h2 className={styles.asideTitle}>{relatedTitle}</h2>
            <ul className={styles.list}>
              {related.map((item) => (
                <li key={item.id}>
                  <Link className={styles.item} href={articleHref(item)}>
                    <Image
                      src={item.image.src}
                      alt=""
                      width={72}
                      height={72}
                      unoptimized
                      className={styles.thumb}
                    />
                    <span className={styles.itemCopy}>
                      <span
                        className={`${styles.itemBadge} ${
                          item.category === "اخبار" ? styles.itemBadgeGhost : ""
                        }`}
                      >
                        {item.category}
                      </span>
                      <span className={styles.itemTitle}>{item.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
