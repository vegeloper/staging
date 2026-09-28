import CooperationCardItem, {
  CooperationCard,
} from "../CooperationCardItem/CooperationCardItem";

import styles from "./CooperationSection.module.css";

type CooperationSectionProps = {
  title: string;
  subtitle?: string;
  cards: CooperationCard[];
};

export default function CooperationSection({
  title,
  subtitle,
  cards,
}: CooperationSectionProps) {
  return (
    <section className={`${styles.section} max-large-scale`} dir="rtl">
      <div className={styles.heading}>
        <h2 className={styles.title}>{title}</h2>

        {subtitle && (
          <p className={styles.subtitle}>{subtitle}</p>
        )}
      </div>

      <div className={styles.cards}>
        {cards.map((card, index) => (
          <CooperationCardItem
            key={`${card.title}-${index}`}
            card={card}
          />
        ))}
      </div>
    </section>
  );
}