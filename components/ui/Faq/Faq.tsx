"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import styles from "./FAQ.module.css";

export type FAQItem = {
  question: string;
  answer: string;
};

type FAQProps = {
  items: FAQItem[];

  subtitle?: string;
  title?: string;
  description?: string;

  defaultOpenIndex?: number;

  moreButtonText?: string;
  onMoreClick?: () => void;

  showMoreButton?: boolean;
};

export default function FAQ({
  items,
  subtitle = "",
  title = "سؤالات متداول",
  description,
  defaultOpenIndex = 0,
  moreButtonText = "مشاهده سوالات بیشتر",
  onMoreClick,
  showMoreButton = true,
}: FAQProps) {
  const [openFaq, setOpenFaq] = useState<number>(defaultOpenIndex);

  const handleToggle = (index: number) => {
    setOpenFaq((currentIndex) =>
      currentIndex === index ? -1 : index
    );
  };

  return (
    <section className={styles.section} dir="rtl">
      <div className={styles.header}>
        {subtitle && (
          <span className={styles.subtitle}>
            {subtitle}
          </span>
        )}

        {title && (
          <h2 className={styles.title}>
            {title}
          </h2>
        )}

        {description && (
          <p className={styles.intro}>
            {description}
          </p>
        )}
      </div>

      <div className={styles.faqList}>
        {items.map((item, index) => {
          const isOpen = openFaq === index;

          return (
            <div
              key={`${item.question}-${index}`}
              className={styles.faqItem}
            >
              <button
                type="button"
                className={styles.question}
                onClick={() => handleToggle(index)}
                aria-expanded={isOpen}
              >
                <span className={styles.questionText}>
                  {item.question}
                </span>

                <ChevronDown
                  className={`${styles.chevron} ${
                    isOpen ? styles.chevronOpen : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              <div
                className={`${styles.answerWrapper} ${
                  isOpen ? styles.answerWrapperOpen : ""
                }`}
              >
                <div className={styles.answerInner}>
                  <p className={styles.answerText}>
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
{/* 
      {showMoreButton && (
        <div className={styles.moreBtnWrapper}>
          <button
            type="button"
            className={styles.moreBtn}
            onClick={onMoreClick}
          >
            {moreButtonText}
          </button>
        </div>
      )} */}
    </section>
  );
}