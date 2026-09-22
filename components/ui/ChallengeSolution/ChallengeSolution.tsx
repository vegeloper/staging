import Image, { type StaticImageData } from "next/image";

import styles from "./ChallengeSolution.module.css";

export type ChallengeRow = {
  challenge: string;
  solution: string;
};

type Media = {
  src: StaticImageData | string;
  alt: string;
};

type ChallengeSolutionProps = {
  title?: string;
  description?: string;
  challengeHeading?: string;
  solutionHeading?: string;
  rows?: ChallengeRow[];
  cabin?: Media;
  fleet?: Media;
};

const defaultRows: ChallengeRow[] = [
  {
    challenge: "هماهنگی چندین سرویس و مسیر",
    solution: "تعریف و هماهنگی سرویس‌ها در یک چارچوب مشخص",
  },
  {
    challenge: "مدیریت خودرو و راننده",
    solution: "تخصیص و هماهنگی منابع متناسب با سرویس",
  },
  {
    challenge: "تغییرات در برنامه سفر",
    solution: "امکان هماهنگی سرویس متناسب با نیازهای سازمان",
  },
  {
    challenge: "نبود دید یکپارچه روی سرویس‌ها",
    solution: "ارائه اطلاعات متمرکز برای پیگیری و مدیریت بهتر",
  },
];

export default function ChallengeSolution({
  title = "حمل‌ونقل سازمانی را ساده‌تر مدیریت کنید",
  description = "مدیریت سفر کارکنان و برنامه‌های سازمانی، با افزایش تعداد مسیرها، خودروها و سرویس‌ها پیچیده‌تر می‌شود. دات‌وان تریپ با ارائه یک راهکار یکپارچه، بخشی از این پیچیدگی را از دوش سازمان برمی‌دارد.",
  challengeHeading = "چالش‌ها",
  solutionHeading = "راهکار دات‌وان",
  rows = defaultRows,
  cabin = {
    src: "/figma/png/cars-insideCabin.png",
    alt: "کابین هوشمند خودروی دات‌وان تریپ",
  },
  fleet = {
    src: "/figma/png/cars-navy.jpg",
    alt: "ناوگان خودروهای دات‌وان تریپ",
  },
}: ChallengeSolutionProps) {
  return (
    <section className={styles.section} dir="rtl">
      <div className={styles.shell}>
        <div className={styles.intro}>
          <div className={styles.photos}>
            <div className={styles.cabinFrame}>
              <Image
                src={cabin.src}
                alt={cabin.alt}
                fill
                unoptimized
                sizes="(max-width: 900px) 68vw, 330px"
                className={styles.photo}
              />
            </div>
            <div className={styles.fleetFrame}>
              <Image
                src={fleet.src}
                alt={fleet.alt}
                fill
                unoptimized
                sizes="(max-width: 900px) 58vw, 285px"
                className={styles.photo}
              />
            </div>
          </div>

          <div className={styles.copy}>
            {title && <h2 className={styles.title}>{title}</h2>}
            <p className={styles.description}>{description}</p>
          </div>
        </div>

        <div
          className={styles.comparison}
          role="table"
          aria-label={`${challengeHeading} و ${solutionHeading}`}
        >
          <div className={styles.headings} role="row">
            <h3 role="columnheader">{challengeHeading}</h3>
            <h3 role="columnheader">{solutionHeading}</h3>
          </div>

          <div className={styles.tableBody} role="rowgroup">
            {rows.map((row, index) => (
              <div className={styles.row} role="row" key={`${row.challenge}-${index}`}>
                <div className={styles.cell} role="cell" data-label={challengeHeading}>
                  {row.challenge}
                </div>
                <div className={styles.cell} role="cell" data-label={solutionHeading}>
                  {row.solution}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
