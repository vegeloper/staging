import Image, { StaticImageData } from "next/image";

import { isLibraryFilePath } from "@/lib/media/paths";
import styles from "./TripStartHero.module.css";

type TripStartHeroProps = {
  image: string | StaticImageData;
  imageAlt?: string;

  eyebrow?: string;
  title: string;
  description?: string;
};

export default function TripStartHero({
  image,
  imageAlt = "",
  eyebrow,
  title,
  description,
}: TripStartHeroProps) {
  return (
    <section className={styles.section} dir="rtl">
      <div className={styles.heading}>
        {eyebrow && (
          <span className={styles.eyebrow}>
            {eyebrow}
          </span>
        )}

        <h2 className={styles.title}>
          {title}
        </h2>

        {description && (
          <p className={styles.description}>
            {description}
          </p>
        )}
      </div>

      <div className={styles.imageWrapper}>
        <Image
          src={image}
          alt={imageAlt}
          fill
          unoptimized={typeof image === "string" && isLibraryFilePath(image)}
          className={styles.image}
          sizes="100vw"
          quality={90}
        />
      </div>
    </section>
  );
}