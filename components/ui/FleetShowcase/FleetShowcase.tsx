import React from "react";
import Image from "next/image";
import styles from "./FleetShowcase.module.css";
import HeroImage from "@/public/figma/vehicleHero.png";
import StarIcon from "@/public/figma/star.png";
import tickIcon from "@/public/figma/tick.png";
import carIcon from "@/public/figma/car4.png";
import Link from "next/link";

export default function FleetShowcase() {
  return (
    <section className={styles.section} dir="rtl">
      <div className={styles.container}>
        {/* === بخش هدر === */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.highlight}>ناوگان دات‌وان تریپ</span> را بشناسید
          </h2>
          <p className={styles.subtitle}>
            ناوگانی متناسب با نیازهای مختلف سفر! از سفرهای شهری و بین‌شهری
            تا خدمات اختصاصی و سازمانی
          </p>
        </div>

        {/* === بخش تصویر و کارت‌های شناور === */}
        <div className={styles.heroSection}>
          <div className={styles.imageWrapper}>
            <Image
              src={HeroImage}
              alt="ناوگان دات‌وان تریپ"
              width={800}
              height={450}
              style={{ width: "100%", height: "auto" }}
              className={styles.heroImage}
              priority
            />
          </div>

          {/* کارت شناور بالا راست */}
          <div className={`${styles.floatingCard} ${styles.cardTopRight}`}>
            <Image
              src={StarIcon}
              alt="ستاره"
              className={styles.cardIcon}
            />
            <span className={styles.cardText}>رانندگان حرفه ای و مجرب</span>
          </div>

          {/* کارت شناور پایین چپ */}
          <div className={`${styles.floatingCard} ${styles.cardBottomLeft}`}>
            <Image
              src={tickIcon}
              alt="تیک ایمنی"
              className={styles.cardIcon}
            />
            <span className={styles.cardText}>ایمنی در اولویت</span>
          </div>
        </div>

        {/* === بخش دکمه‌ها === */}
        <div className={styles.actions}>
          <Link href={"/vehicles"} className={`${styles.btn} ${styles.btnPrimary}`}>
            <Image src={carIcon} alt="آیکون خودرو" width={20} height={20} />
            مشاهده خودروها
          </Link>

          <button className={`${styles.btn} ${styles.btnSecondary}`}>
            مشاهده خدمات
          </button>
        </div>
      </div>
    </section>
  );
}