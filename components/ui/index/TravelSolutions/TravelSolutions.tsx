import TravelSolutionCard, {
  TravelSolutionCardProps,
} from "./TravelSolutionCard/TravelSolutionCard";

import styles from "./TravelSolutions.module.css";

type TravelSolutionsProps = {
  badge?: string;
  title: string;
  description: string;

  cards: TravelSolutionCardProps[];
};

export default function TravelSolutions({
  badge,
  title,
  description,
  cards,
}: TravelSolutionsProps) {
  return (
    <section
      className={`${styles.section} max-large-scale`}
      dir="rtl"
    >
      {/* Background Shade */}
      <div
        className={styles.backgroundShade}
        aria-hidden="true"
      />

      <div className={styles.container}>
        {/* Heading */}
        <div className={styles.heading}>
          <div className={styles.headingMain}>
            {badge && (
              <span className={styles.sectionBadge}>
                <span className={styles.badgeDot} />

                {badge}
              </span>
            )}

            <h2 className={styles.title}>
              {title}
            </h2>
          </div>

          <p className={styles.description}>
            {description}
          </p>
        </div>

        {/* Cards */}
        <div className={styles.cards}>
          {cards.map((card, index) => (
            <TravelSolutionCard
              key={`${card.title}-${index}`}
              {...card}
            />
          ))}
        </div>
      </div>
    </section>
  );
}