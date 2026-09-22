import React from "react";
import Image from "next/image";
import { Car, UserCheck, Navigation, MapPin } from "lucide-react";
import styles from "./TripExperience.module.css";
import journeyImage from "@/public/figma/journey.png";
import DotIcon from "@/public/figma/dot.png";
interface StepItem {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const stepsData: StepItem[] = [
  {
    id: 1,
    title: "درخواست سفر",
    description: "مبدأ و مقصدتان را مشخص کنید و درخواست سفر را ثبت کنید.",
    icon: <Car className={styles.icon} />,
  },
  {
    id: 2,
    title: "انتخاب و تخصیص خودرو",
    description:
      "متناسب با درخواست شما،خودرو و راننده مناسب انتخاب و در کوتاه ترین زمان تخصیص داده میشود.",

    icon: <UserCheck className={styles.icon} />,
  },
  {
    id: 3,
    title: "شروع سفر",
    description:"پس از رسیدن خودرو، سفر آغاز و میتوانید مسیر حرکت را تا مقصد دنبال کنید.",
    icon: <Navigation className={styles.icon} />,
  },
  {
    id: 4,
    title: "رسیدن به مقصد",
    description: "سفر را با تجربه‌ای راحت و مطمئن به پایان برسانید.",
    icon: <MapPin className={styles.icon} />,
  },
];

export default function TripExperience() {
  return (
    <section className={styles.sectionContainer} dir="rtl">
      <div className={styles.header}>
        <div className={styles.badge}>
 
          <span>تجربه سفر با داتوان</span>
        </div>
        <h2 className={styles.mainTitle}>برای هر مسیر شهری، یک تجربه بهتر</h2>
      </div>

      <div className={styles.bannerContainer}>
        <div className={styles.imageWrapper}>
          <Image
            src={journeyImage}
            alt="تجربه سفر شهری داتوان"
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className={styles.bgImage}
            priority
          />
        </div>

        <div className={styles.cardsGrid}>
          {stepsData.map((step) => (
            <div key={step.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBox}>{step.icon}</div>
                <h3 className={styles.cardTitle}>{step.title}</h3>
              </div>
              <p className={styles.cardDescription}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
