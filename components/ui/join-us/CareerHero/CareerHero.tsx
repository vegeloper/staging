import Image, { StaticImageData } from "next/image";
import styles from "./CareerHero.module.css";

type CareerHeroProps = {
  badge?: string;
  title: string;
  highlightedText?: string;
  description: string;
  image: string | StaticImageData;
  imageAlt?: string;
};

export default function CareerHero({
  badge = "فرصت‌های همکاری",
  title,
  highlightedText,
  description,
  image,
  imageAlt = "",
}: CareerHeroProps) {
  return (
    <section className={styles.hero} dir="rtl">
      <div className={styles.content}>
      <div className={styles.badge}>
          <span className={styles.badgeDot} />
          {badge}
        </div>

        <h1 className={styles.title}>
          {highlightedText && (
            <span className={styles.highlight}>{highlightedText} </span>
          )}

          {title}
        </h1>

        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.imageWrapper}>
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          className={styles.image}
          sizes="(max-width: 768px) 92vw, 50vw"
        />
      </div>
    </section>
  );
}