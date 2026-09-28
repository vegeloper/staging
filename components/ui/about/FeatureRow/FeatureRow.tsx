import Image from "next/image";
import styles from "./FeatureRow.module.css";

import type { StaticImageData } from "next/image";

export type FeatureCard = {
  image: string | StaticImageData;
  title: string;
  description: string;
  alt?: string;
};
type FeatureRowProps = {
  title: string;
  description: string;
  cards: FeatureCard[];
  direction?: "right" | "left";
};

export default function FeatureRow({
  title,
  description,
  cards,
  direction = "right",
}: FeatureRowProps) {
  return (
    <section
      className={`${styles.row} ${
        direction === "left" ? styles.reverse : ""
      } max-large-scale`}
      dir="rtl"
    >
      {/* Text */}
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>

        <p className={styles.description}>{description}</p>
      </div>

      {/* Cards */}
      <div className={styles.cards}>
        {cards.map((card, index) => (
          <article className={styles.card} key={`${card.title}-${index}`}>
            <Image
              src={card.image}
              alt={card.alt ?? card.title}
              fill
              className={styles.cardImage}
              sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 25vw"
            />

            <div className={styles.overlay} />

            <div className={styles.cardContent}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}