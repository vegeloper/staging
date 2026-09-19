import Image, { StaticImageData } from "next/image";
import Link from "next/link";

import styles from "./FleetFeature.module.css";

export type FleetFeatureItem = {
  text: string;
};

type FleetFeatureProps = {
  title: string;
  description: string;
  items: FleetFeatureItem[];

  image: string | StaticImageData;
  imageAlt?: string;

  buttonText?: string;
  buttonHref?: string;

  imageSide?: "right" | "left";
};

export default function FleetFeature({
  title,
  description,
  items,
  image,
  imageAlt = "",
  buttonText,
  buttonHref,
  imageSide = "right",
}: FleetFeatureProps) {
  return (
    <section
      className={`${styles.section} ${
        imageSide === "left" ? styles.imageLeft : ""
      }`}
      dir="rtl"
    >
      {/* Image */}
      <div className={styles.imageColumn}>
        <div className={styles.imageWrapper}>
          <Image
            src={image}
            alt={imageAlt}
            fill
            className={styles.image}
            sizes="
              (max-width: 700px) 90vw,
              (max-width: 1000px) 42vw,
              420px
            "
          />
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.title}>
          {title}
        </h3>

        <p className={styles.description}>
          {description}
        </p>

        <ul className={styles.list}>
          {items.map((item, index) => (
            <li
              key={`${item.text}-${index}`}
              className={styles.listItem}
            >
              {item.text}
            </li>
          ))}
        </ul>

        <div className={styles.buttonWrapper}>
          {buttonHref&&buttonText?(      <Link
            href={buttonHref}
            className={styles.button}
          >
            {buttonText}
          </Link>):(<></>)}
        </div>
      </div>
    </section>
  );
}