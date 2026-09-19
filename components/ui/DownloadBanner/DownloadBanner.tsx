import React from "react";
import Image from "next/image";

import styles from "./DownloadBanner.module.css";
import DeviceImage from "@/public/figma/device.png";
import appleIcon from "@/public/figma/apple.png";
import myketIcon from "@/public/figma/myket.png";
import bazarIcon from "@/public/figma/bazar.png";
import Link from "next/link";

export default function DownloadBanner() {
  return (
    <section className={styles.sectionContainer} id="download-banner" dir="rtl">
      <div className={styles.banner}>
        <div className={styles.imageWrapper}>
          <Image
            src={DeviceImage}
            alt="نمای اپلیکیشن دات‌وان تریپ"
            fill
            className={styles.phonesImage}
            priority
          />
        </div>

        <div className={styles.content} >
          <span className={styles.subtitle}>دانلود اپلیکیشن</span>

          <h2 className={styles.title}>دات‌وان تریپ همیشه همراه شماست</h2>

          <p className={styles.description}>
            اپلیکیشن دات‌وان تریپ را دانلود کنید و درخواست سفر، مدیریت مسیر و
            پرداخت را سریع‌تر و ساده‌تر از همیشه تجربه کنید.
          </p>

          <div className={styles.buttonsGroup}>
            <Link href="https://myket.ir/app/com.dotone.passenger" className={styles.downloadBtn}>
              <Image src={myketIcon} alt="مایکت" width={24} height={24} />
              <span>مایکت</span>
            </Link>

            <Link href="#" className={styles.downloadBtn}>
              <Image src={bazarIcon} alt="https://cafebazaar.ir/app/com.dotone.passenger?ref=share" width={24} height={24} />
              <span>کافه بازار</span>
            </Link>

            <Link href="https://app.trip.dotone.ir/#/splash" className={styles.downloadBtn}>
              <Image src={appleIcon} alt="وب اپلیکیشن" width={24} height={24} />
              <span>وب اپلیکیشن (کاربران ios)</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
