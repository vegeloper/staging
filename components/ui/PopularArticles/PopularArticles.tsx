"use client";

import {
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";

import { Article, articleHref } from "@/lib/articles";

import styles from "./PopularArticles.module.css";

type PopularArticlesProps = {
  title?: string;
  articles: Article[];
};

const SWIPE_THRESHOLD = 45;
const DRAG_RESISTANCE = 0.72;

export default function PopularArticles({
  title = "مطالب محبوب:",
  articles,
}: PopularArticlesProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  /*
    مقدار حرکت افقی کارت هنگام Swipe
  */
  const [dragX, setDragX] = useState(0);

  /*
    مشخص می‌کند انگشت در حال Drag است یا نه
  */
  const [isSwiping, setIsSwiping] = useState(false);

  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);

  const isDragging = useRef(false);

  /*
    برای جلوگیری از باز شدن Link بعد از Swipe
  */
  const didSwipe = useRef(false);

  if (articles.length === 0) {
    return null;
  }

  const safeIndex =
    activeIndex >= articles.length
      ? 0
      : activeIndex;

  const featured = articles[safeIndex];

  /* ========================================
     Change Slide
  ======================================== */

  const goTo = (index: number) => {
    const last = articles.length - 1;

    if (index < 0) {
      setActiveIndex(last);
      return;
    }

    if (index > last) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex(index);
  };

  /* ========================================
     Pointer Down
  ======================================== */

  const handlePointerDown = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    /*
      Swipe فقط برای Touch / Pen

      روی Desktop همان Arrowها را داریم.
    */
    if (event.pointerType === "mouse") {
      return;
    }

    pointerStartX.current = event.clientX;
    pointerStartY.current = event.clientY;

    isDragging.current = true;
    didSwipe.current = false;

    setIsSwiping(true);
    setDragX(0);
  };

  /* ========================================
     Pointer Move
  ======================================== */

  const handlePointerMove = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (
      !isDragging.current ||
      pointerStartX.current === null ||
      pointerStartY.current === null
    ) {
      return;
    }

    const deltaX =
      event.clientX - pointerStartX.current;

    const deltaY =
      event.clientY - pointerStartY.current;

    /*
      اگر حرکت افقی باشد کارت همراه انگشت حرکت کند.

      اگر حرکت عمودی باشد دخالت نمی‌کنیم
      تا Scroll صفحه طبیعی باقی بماند.
    */
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDragX(deltaX * DRAG_RESISTANCE);
    }
  };

  /* ========================================
     Pointer Up
  ======================================== */

  const handlePointerUp = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (
      !isDragging.current ||
      pointerStartX.current === null ||
      pointerStartY.current === null
    ) {
      setDragX(0);
      setIsSwiping(false);

      return;
    }

    const deltaX =
      event.clientX - pointerStartX.current;

    const deltaY =
      event.clientY - pointerStartY.current;

    const isHorizontalSwipe =
      Math.abs(deltaX) > Math.abs(deltaY);

    const hasPassedThreshold =
      Math.abs(deltaX) >= SWIPE_THRESHOLD;

    if (
      isHorizontalSwipe &&
      hasPassedThreshold
    ) {
      didSwipe.current = true;

      /*
        Swipe به چپ
        => اسلاید بعدی
      */
      if (deltaX < 0) {
        goTo(safeIndex + 1);
      }

      /*
        Swipe به راست
        => اسلاید قبلی
      */
      if (deltaX > 0) {
        goTo(safeIndex - 1);
      }
    }

    pointerStartX.current = null;
    pointerStartY.current = null;

    isDragging.current = false;

    /*
      کارت با Transition نرم
      به نقطه اصلی برمی‌گردد.
    */
    setIsSwiping(false);
    setDragX(0);
  };

  /* ========================================
     Pointer Cancel
  ======================================== */

  const handlePointerCancel = () => {
    pointerStartX.current = null;
    pointerStartY.current = null;

    isDragging.current = false;

    setIsSwiping(false);
    setDragX(0);
  };

  /* ========================================
     Prevent Link After Swipe
  ======================================== */

  const handleFeaturedClick = (
    event: MouseEvent<HTMLAnchorElement>,
  ) => {
    if (!didSwipe.current) {
      return;
    }

    event.preventDefault();

    didSwipe.current = false;
  };

  return (
    <section
      className={styles.section}
      dir="rtl"
      aria-label={title}
    >
      <div className={styles.layout}>
        {/* ========================================
            Aside
        ======================================== */}

        <aside className={styles.aside}>
          <h2 className={styles.title}>
            {title}
          </h2>

          <ul className={styles.list}>
            {articles.map(
              (article, index) => (
                <li key={article.id}>
                  <button
                    type="button"
                    className={`${styles.item} ${
                      index === safeIndex
                        ? styles.itemActive
                        : ""
                    }`}
                    onClick={() =>
                      setActiveIndex(index)
                    }
                    aria-current={
                      index === safeIndex
                        ? "true"
                        : undefined
                    }
                  >
                    <Image
                      src={article.image.src}
                      alt=""
                      width={72}
                      height={72}
                      unoptimized
                      className={styles.thumb}
                    />

                    <span
                      className={
                        styles.itemCopy
                      }
                    >
                      <span
                        className={
                          styles.itemBadge
                        }
                      >
                        {article.category}
                      </span>

                      <span
                        className={
                          styles.itemTitle
                        }
                      >
                        {article.title}
                      </span>
                    </span>
                  </button>
                </li>
              ),
            )}
          </ul>
        </aside>

        {/* ========================================
            Featured Column
        ======================================== */}

        <div className={styles.featuredCol}>
          {/* ========================================
              Desktop Navigation
          ======================================== */}

          <div
            className={styles.nav}
            dir="ltr"
          >
            <button
              type="button"
              className={`${styles.navButton} ${styles.navPrev}`}
              onClick={() =>
                goTo(safeIndex - 1)
              }
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
              onClick={() =>
                goTo(safeIndex + 1)
              }
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

          {/* ========================================
              Swipe Area
          ======================================== */}

          <div
            className={`${styles.swipeArea} ${
              isSwiping
                ? styles.isSwiping
                : ""
            }`}
            onPointerDown={
              handlePointerDown
            }
            onPointerMove={
              handlePointerMove
            }
            onPointerUp={handlePointerUp}
            onPointerCancel={
              handlePointerCancel
            }
          >
            <div
              className={styles.slideMotion}
              style={{
                transform: `translate3d(${dragX}px, 0, 0)`,
              }}
            >
              <Link
                className={styles.featured}
                href={articleHref(featured)}
                onClick={
                  handleFeaturedClick
                }
              >
                {/* Image */}

                <Image
                  src={featured.image.src}
                  alt={featured.image.alt}
                  fill
                  unoptimized
                  draggable={false}
                  sizes="(max-width: 900px) 100vw, 68vw"
                  className={
                    styles.featuredImage
                  }
                  style={
                    featured.image
                      .objectPosition
                      ? {
                          objectPosition:
                            featured.image
                              .objectPosition,
                        }
                      : undefined
                  }
                />

                {/* Overlay */}

                <div
                  className={styles.overlay}
                >
                  <div
                    className={
                      styles.featuredCopy
                    }
                  >
                    <span
                      className={
                        styles.badge
                      }
                    >
                      {featured.category}
                    </span>

                    <h3
                      className={
                        styles.featuredTitle
                      }
                    >
                      {featured.title}
                    </h3>
                  </div>

                  {/* Meta */}

                  {(featured.date ||
                    featured.comments ||
                    featured.likes) && (
                    <div
                      className={
                        styles.meta
                      }
                    >
                      <span
                        className={
                          styles.metaDash
                        }
                        aria-hidden="true"
                      />

                      {featured.date && (
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
                      )}

                      {featured.comments && (
                        <span>
                          <Image
                            src="/figma/svgs/small-icons/chat.svg"
                            alt=""
                            width={20}
                            height={20}
                            unoptimized
                          />

                          {
                            featured.comments
                          }
                        </span>
                      )}

                      {featured.likes && (
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
                      )}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>

          {/* ========================================
              Mobile / Tablet Dots
          ======================================== */}

          {articles.length > 1 && (
            <div
              className={styles.dots}
              dir="ltr"
              role="group"
              aria-label="انتخاب مطلب"
            >
              {articles.map(
                (article, index) => (
                  <button
                    key={article.id}
                    type="button"
                    className={`${styles.dot} ${
                      index === safeIndex
                        ? styles.dotActive
                        : ""
                    }`}
                    onClick={() =>
                      setActiveIndex(index)
                    }
                    aria-label={`نمایش مطلب ${
                      index + 1
                    }`}
                    aria-current={
                      index === safeIndex
                        ? "true"
                        : undefined
                    }
                  />
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}