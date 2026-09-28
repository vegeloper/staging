import styles from "./EcosystemSection.module.css";

export type EcosystemItem = {
  title: string;
  description: string;
};

type EcosystemSectionProps = {
  title: string;
  subtitle?: string;
  items: EcosystemItem[];
};

export default function EcosystemSection({
  title,
  subtitle,
  items,
}: EcosystemSectionProps) {
  return (
    <section className={`${styles.section} max-large-scale`} dir="rtl">
      <div className={styles.heading}>
        <h2 className={styles.title}>
          {title}
        </h2>

        {subtitle && (
          <p className={styles.subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      <div className={styles.list}>
        {items.map((item, index) => (
          <div
            className={styles.item}
            key={`${item.title}-${index}`}
          >
            <div className={styles.itemHeading}>
              <span className={styles.number}>
                {toPersianNumber(index + 1)}.
              </span>

              <h3 className={styles.itemTitle}>
                {item.title}
              </h3>
            </div>

            <p className={styles.description}>
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function toPersianNumber(value: number) {
  return value.toLocaleString("fa-IR", {
    useGrouping: false,
  });
}