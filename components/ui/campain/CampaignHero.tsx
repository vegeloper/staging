'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import HashScrollLink from '@/components/ui/HashScrollLink';
import styles from './CampaignHero.module.css';

interface CampaignBannerProps {
  /** آدرس فایل ویدیوی شما (پیش‌فرض یک ویدیو نمونه قرار داده شده) */
  videoSrc?: string;
  /** آدرس تصویر پوستر ویدیو قبل از پخش */
  posterSrc?: string;
}

export const CampaignHero: React.FC<CampaignBannerProps> = ({
  videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // آدرس تست ویدیو
  posterSrc = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop", // تصویر نمونه
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <section className={styles.container} dir="rtl">
      {/* نشانگر بالای تیتر (Badge) */}
      <div className={styles.badgeWrapper}>
        <span className={styles.badge}>
          <img src={"/figma/svgs/dot.svg"}/>
          تبلیغی که مسافر نمی‌تواند از کنار آن اسکرول کند
        </span>
      </div>

      {/* تیتر اصلی */}
      <h1 className={styles.title}>
        کسب و کارتان را در تمام مدت سفر در{' '}
        <span className={styles.highlight}>دات‌وان تریپ</span>{' '}<br/>
        مقابل چشم مسافر نمایش دهید.
      </h1>

      {/* توضیح زیر تیتر */}
      <p className={styles.description}>
        تبلیغات ویدیویی، تصویری و QR Code روی مانیتورهای داخل خودروهای دات‌وان تریپ؛
        <br className={styles.desktopBr} />
        رسانه‌ای با ۲۰ تا ۷۵ دقیقه زمان توجه واقعی و هدف‌گذاری منطقه‌ای.
      </p>

      {/* دکمه‌های اقدام (CTA) */}
      <div className={styles.buttonGroup}>
        <HashScrollLink
          href="/campaign/#advertising-request"
          className={styles.primaryBtn}
        >
          ثبت درخواست
        </HashScrollLink>
        <Link href="/contact-us" className={styles.secondaryBtn}>
          درخواست مشاوره
        </Link>
      </div>

      {/* بخش ویدیو */}
      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          className={styles.videoPlayer}
          poster={posterSrc}
          controls={isPlaying}
          onEnded={() => setIsPlaying(false)}
          playsInline
        >
          <source src={videoSrc} type="video/mp4" />
          مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
        </video>

        {/* دکمه پخش ویدیو روی تصویر */}
        {!isPlaying && (
          <button
            className={styles.playOverlayBtn}
            onClick={handlePlayVideo}
            type="button"
            aria-label="مشاهده ویدئو"
          >
            <span className={styles.playText}>مشاهده ویدئو</span>
            <svg
              className={styles.playIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              width="20"
              height="20"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
};

export default CampaignHero;