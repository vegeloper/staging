import Image from "next/image";
import Link from "next/link";
import styles from "./TransportHero.module.css";

import buildingImage from "@/public/figma/oneBuilding.png"
import carImage from "@/public/figma/oneSmartCar.png"

export default function TransportHero() {
  return (
    <section className={styles.hero} dir="rtl">
      <div className={styles.content}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          درباره دات‌وان تریپ
        </div>

        <h1 className={styles.title}>
          دات‌وان تریپ؛ نسل جدید حمل‌ونقل هوشمند
        </h1>

        <p className={styles.description}>
          دات‌وان تریپ با تلفیق ناوگان مدرن، فناوری و مدیریت یکپارچه سفر،
          راهکارهای حمل‌ونقل شهری و سازمانی را متناسب با نیاز و مقیاس هر
          مجموعه ارائه می‌دهد.
        </p>

        <Link href="/contact-us" className={styles.cta}>
          درخواست مشاوره و همکاری
        </Link>
      </div>

      <div className={styles.gallery}>
        <div className={`${styles.imageCard} ${styles.buildingCard}`}>
          <Image
            src={buildingImage}
            alt="نمای شهری و ساختمان"
            fill
            priority
            className={styles.image}
            sizes="(max-width: 768px) 100vw, 62vw"
          />
        </div>

        <div className={`${styles.imageCard} ${styles.carCard}`}>
          <Image
            src={carImage}
            alt="خودروی دات‌وان تریپ"
            fill
            priority
            className={styles.image}
            sizes="(max-width: 768px) 100vw, 36vw"
          />
        </div>
      </div>
    </section>
  );
}