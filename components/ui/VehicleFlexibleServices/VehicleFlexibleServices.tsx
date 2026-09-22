import React from 'react';
import styles from './VehicleFlexibleServices.module.css';

// 1. تعریف ساختار تایپ‌ها (اگر از TypeScript استفاده می‌کنید)
// اگر از JS ساده استفاده می‌کنید، می‌توانید interface را حذف کنید
interface ServiceItem {
  id: number;
  title: string;
  description: string;
  isTall: boolean; // برای تعیین اینکه کارت بلند باشد یا کوتاه
}

// 2. آرایه دیتای داینامیک
const servicesData: ServiceItem[] = [
  {
    id: 1,
    title: 'سواری شهری',
    description: 'مناسب برای سفر‌های روزمره و سفرهای داخل شهر',
    isTall: false,
  },
  {
    id: 2,
    title: 'سواری بین شهری',
    description: 'انتخاب‌هایی متناسب با مسیرهای طولانی‌تر و سفرهای بین‌شهری',
    isTall: true,
  },
  {
    id: 3,
    title: 'خودروهای اختصاصی',
    description: 'مناسب برای سرویس خودرو در اختیار و برنامه‌های چندمقصدی',
    isTall: false,
  },
  {
    id: 4,
    title: 'خودروهای سازمانی',
    description: 'گزینه‌هایی برای نیازهای سفر سازمان‌ها و مجموعه‌ها',
    isTall: true,
  },
];

export default function VehicleFlexibleServices() {
  return (
    <section className={styles.servicesSection} dir="rtl">
      
      {/* هدر کامپوننت */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>کنترل بیشتر، سفر منعطف‌تر</h2>
        <p className={styles.sectionSubtitle}>
          سفر را شما انتخاب می‌کنید؛ ما مسیر را برایتان ساده‌تر می‌کنیم.
        </p>
      </div>

      {/* گرید کارت‌ها */}
      <div className={styles.cardsGrid}>
        {servicesData.map((service) => (
          <div
            key={service.id}
            // اعمال کلاس‌های داینامیک بر اساس مقدار isTall
            className={`${styles.serviceCard} ${
              service.isTall ? styles.cardTall : styles.cardShort
            }`}
          >
            <h3 className={styles.cardTitle}>{service.title}</h3>
            <p className={styles.cardDesc}>{service.description}</p>
          </div>
        ))}
      </div>
      
    </section>
  );
}