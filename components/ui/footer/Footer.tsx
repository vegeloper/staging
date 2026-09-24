"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";
import linkdinIcon from "@/public/figma/linkdin.png";
import telegramIcon from "@/public/figma/telegram.png";
import instagramIcon from "@/public/figma/instagram.png";
import baleIcon from "@/public/figma/baleIcon.png";
import logoImage from "@/public/figma/DotOneTrip-Logo.png"; // ایمپورت لوگو

const footerLinks = [
  {
    title: "خدمات",
    links: [
      { label: "سفر شهری", href: "/services" },
      { label: "سفر بین‌شهری", href: "#" },
      { label: "حمل‌ونقل سازمانی", href: "/b2b" },
      { label: "در اختیار", href: "/oncall" },
    ],
  },
  {
    title: "درباره دات‌وان تریپ",
    links: [
      { label: "درباره ما", href: "/about" },
      { label: "تماس با ما", href: "/contact-us" },
      { label: "پرسش‌های متداول", href: "#" },
      { label: "حریم خصوصی", href: "#" },
      { label: "قوانین و مقررات", href: "#" },
    ],
  },
  {
    title: "توسعه کسب و کارها",
    links: [
      { label: "تبلیغات در اپلیکیشن", href: "#" },
      { label: "تبلیغات داخل خودروها", href: "#" },
      { label: "همکاری در تبلیغات", href: "#" },
    ],
  },
  {
    title: "اخبار و مجله",
    links: [
      { label: "آخرین اخبار", href: "/blog" },
      { label: "رویدادها", href: "/blog" },
      { label: "توسعه ناوگان", href: "/vehicles" },
      { label: "مقالات", href: "/blog" },
      { label: "راهنمای سفر", href: "/blog" },
    ],
  },
  {
    title: "همکاری با دات‌وان تریپ",
    links: [
      { label: "استخدام رانندگان", href: "/join-us/drivers" },
      { label: "طرح مشارکت", href: "https://apply.dotone.ir/" },
      { label: "فرصت‌های همکاری", href: "#" },
      { label: "شرایط همکاری", href: "#" },
      { label: "ثبت درخواست", href: "#" },
    ],
  },
  {
    title: "دانلود اپلیکیشن",
    links: [
      { label: "دانلود برای Android",href: "/#download-banner" },
      { label: "دانلود برای iOS", href: "/#download-banner" },
      { label: "دانلود نسخه وب اپلیکیشن", href: "/#download-banner" },

    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer} dir="rtl">
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.brandWrapper}>
            <Image
              src={logoImage}
              alt="لوگو دات‌وان تریپ"
              width={70}
              height={70}
              className={styles.logoImage}
            />
            <div className={styles.brandText}>
              <span className={styles.brandName}>دات‌وان تریپ</span>
              <span className={styles.brandExclamation}>!</span>
            </div>
          </div>

          <p className={styles.description}>
            <strong>مجموعه دات وان تریپ</strong> با رویکرد ارائه خدمات سفرهای درون
            شهری و برون شهری با <strong>خودروهای برقی و هیبریدی</strong> ضمن
            توجه به سهم خود در <strong>حفظ محیط زیست</strong> با تامین خودروهایی
            که تماما با زیرساخت‌های تکنولوژی روز کشورهای توسعه یافته تجهیز شده
            بر آن است تا برترین کیفیت خدمات را به شما مسافران عزیز ارائه نماید.
          </p>

          <div className={styles.socialIcons} style={{ direction: "ltr" }}>
            <Link href="https://www.linkedin.com/company/dotonetrip_info/" aria-label="LinkedIn" className={styles.socialLink}>
              <Image src={linkdinIcon} alt="لینکدین" />
            </Link>
            <Link href="https://t.me/DotOnetrip_info" aria-label="Telegram" className={styles.socialLink}>
              <Image src={telegramIcon} alt="تلگرام" />
            </Link>

            <Link href="https://www.instagram.com/dotonetrip" aria-label="Instagram" className={styles.socialLink}>
              <Image src={instagramIcon} alt="اینستاگرام" />
            </Link>
            <Link href="https://ble.ir/dotonetrip_info" aria-label="بله" className={styles.socialLink}>
              <Image src={baleIcon} alt="بله" />
            </Link>
          </div>
        </div>

        <div className={styles.linksGrid}>
          {footerLinks.map((column, index) => (
            <div key={index} className={styles.linkColumn}>
              <h4 className={styles.columnTitle}>{column.title}</h4>
              <ul className={styles.linkList}>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={styles.linkItem}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* === بخش پایینی (کپی‌رایت) === */}
      <div className={styles.bottomSection}>
        <p>
          تمامی حقوق این سایت متعلق به شرکت <strong>دات وان تریپ</strong> می
          باشد
        </p>
      </div>
    </footer>
  );
}
