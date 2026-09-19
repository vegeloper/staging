import Image, {
  StaticImageData,
} from "next/image";

import AdvertisingRequestForm from "./AdvertisingRequestForm";

import {
  AdvertisingFormValues,
} from "./advertisingRequest.schema";

import styles from "./AdvertisingRequest.module.css";

type AdvertisingRequestProps = {
  image: string | StaticImageData;

  imageAlt?: string;

  title?: string;

  description?: string;

  id?: string;

  onSubmit?: (
    data: AdvertisingFormValues
  ) => void | Promise<void>;
};

export default function AdvertisingRequest({
  image,

  imageAlt = "خودروی دات‌وان تریپ",

  title = "فرم پیش‌ثبت‌نام همکاری تبلیغاتی",

  description = "برای شروع همکاری، اطلاعات زیر را تکمیل کنید تا کارشناسان دات‌وان با شما تماس بگیرند.",

  id,

  onSubmit,
}: AdvertisingRequestProps) {
  return (
    <section
      className={styles.section}
      dir="rtl"
      id={id}
    >
      <div className={styles.heading}>
        <h2 className={styles.sectionTitle}>
          {title}
        </h2>

        <p
          className={
            styles.sectionDescription
          }
        >
          {description}
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.formColumn}>
          <AdvertisingRequestForm
            onSubmit={onSubmit}
          />
        </div>

        <div className={styles.imageWrapper}>
          <Image
            src={image}
            alt={imageAlt}
            fill
            className={styles.image}
            sizes="(max-width: 1000px) 1px, 540px"
          />
        </div>
      </div>
    </section>
  );
}