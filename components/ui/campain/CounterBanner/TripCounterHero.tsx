"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./TripCounterHero.module.css";

type TripCounterHeroProps = {
  count: number;
  backgroundImage: string;

  badge?: string;
  title?: string;

  duration?: number;
  suffix?: string;
};

export default function TripCounterHero({
  count,
  backgroundImage,
  badge = "جایی که مسیر به فرصت تبلیغاتی تبدیل می‌شود",
  title = "سفرهای این هفته دات‌وان تریپ!",
  duration = 1800,
  suffix = "+",
}: TripCounterHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  const [displayCount, setDisplayCount] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setShouldAnimate(true);
        observer.disconnect();
      },
      {
        threshold: 0.25,
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldAnimate) return;

    const target = Math.max(0, count);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      setDisplayCount(target);
      return;
    }

    let frameId = 0;
    let startTime: number | null = null;

    const animate = (time: number) => {
      if (startTime === null) {
        startTime = time;
      }

      const progress = Math.min((time - startTime) / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 4);

      setDisplayCount(Math.floor(target * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setDisplayCount(target);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [shouldAnimate, count, duration]);

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      dir="rtl"
      style={{
        backgroundImage: `url("${backgroundImage}")`,
      }}
    >
      {/* سفید شدن اطراف background */}
      <div className={styles.backgroundFade} />

      <div className={styles.content}>
        {badge && (
          <div className={styles.badge}>
            <span className={styles.brace}>
              <img
                src="/figma/svgs/rightwheat.svg"
                alt=""
                className={styles.wheatIcon}
              />
            </span>

            <span>{badge}</span>

            <span className={styles.brace}>
              <img
                src="/figma/svgs/leftwheat.svg"
                alt=""
                className={styles.wheatIcon}
              />
            </span>
          </div>
        )}

        <div className={styles.counterArea}>
          <div className={styles.counter} aria-label={`${count} سفر`}>
            {suffix && <span className={styles.suffix}>{suffix}</span>}

            <span className={styles.number}>{formatNumber(displayCount)}</span>
          </div>
          {/* لایه محو کننده روی پایین اعداد */}
          <div className={styles.numberFade} />
        </div>

        <h2 className={styles.title}>{title}</h2>
      </div>
    </section>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("fa-IR", {
    useGrouping: true,
  });
}
