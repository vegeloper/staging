import React from "react";
import Image from "next/image";
import styles from "./FlexibleTravel.module.css";
import backwardIcon from "@/public/figma/backward-item.png";
import emojiNormalIcon from "@/public/figma/emoji-normal.png";
import maximizeIcon from "@/public/figma/maximize.png";
import timerIcon from "@/public/figma/timer.png";

// اختصاص آیکون‌های متناسب به هر ویژگی
const featuresData = [
  {
    id: 1,
    title: "انعطاف بیشتر",
    description: "برنامه سفر شما می‌تواند شامل چند مقصد و توقف باشد.",
    icon: maximizeIcon, 
  },
  {
    id: 2,
    title: "صرفه‌جویی در زمان",
    description: "نیازی نیست برای هر سفر مجدداً درخواست خودرو ثبت کنید.",
    icon: timerIcon,
  },
  {
    id: 3,
    title: "راحتی بیشتر",
    description: "خودرو و راننده در طول بازه سرویس همراه شما هستند.",
    icon: emojiNormalIcon,
  },
  {
    id: 4,
    title: "مناسب برای برنامه‌های متغیر",
    description: "اگر برنامه شما در طول روز تغییر می‌کند، این مدل سرویس می‌تواند انعطاف بیشتری در اختیار شما قرار دهد.",
    icon: backwardIcon,
  },
];

export default function FlexibleTravel() {
  return (
    <section className={styles.section} dir="rtl">
      <div className={styles.container}>
        
        {/* === بخش هدر (عنوان و زیرعنوان) === */}
        <div className={styles.header}>
          <h2 className={styles.title}>کنترل بیشتر، سفر منعطف‌تر</h2>
          <p className={styles.subtitle}>
            سفر را شما انتخاب می‌کنید؛ ما مسیر را برایتان ساده‌تر می‌کنیم.
          </p>
        </div>

        {/* === بخش گرید ویژگی‌ها === */}
        <div className={styles.grid}>
          {featuresData.map((feature) => (
            <div key={feature.id} className={styles.featureCard}>
              
              {/* جایگاه آیکون که حالا با تگ Image پر شده است */}
              <div className={styles.iconWrapper}>
                <Image 
                  src={feature.icon} 
                  alt={feature.title} 
                  width={24} 
                  height={24} 
                  style={{ objectFit: "contain" }}
                />
              </div>

              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}