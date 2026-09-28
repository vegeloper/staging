import styles from "./InnovationSection.module.css";

export type InnovationCard = {
  title: string;
  description: string;
  icon: string;
  iconAlt?: string;
  variant?: "light" | "dark";
};

type InnovationSectionProps = {
  title: string;
  subtitle?: string;
  cards: InnovationCard[];
};

export default function InnovationSection({
  title,
  subtitle,
  cards,
}: InnovationSectionProps) {
  return (
    <section className={`${styles.section} max-large-scale`} dir="rtl">
      <div className={styles.heading}>
        <h2 className={styles.title}>{title}</h2>

        {subtitle && (
          <p className={styles.subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      <div className={styles.cards}>
        {cards.map((card, index) => (
          <article
            key={`${card.title}-${index}`}
            className={`${styles.card} ${
              card.variant === "dark"
                ? styles.dark
                : styles.light
            }`}
          >
            <div className={styles.iconWrapper}>
              <img
                src={card.icon}
                alt={card.iconAlt ?? ""}
                className={styles.icon}
              />
            </div>

            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>
                {card.title}
              </h3>

              <p className={styles.cardDescription}>
                {card.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}