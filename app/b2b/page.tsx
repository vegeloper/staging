import Header from "@/components/ui/Header/Header";
import Hero from "@/components/ui/Hero/HeroDynamic";
import React from "react";
import dotIcon from "@/public/figma/dot.png";
import HeroImage from "@/public/figma/b2bHero.png";
import taxiIcon from "@/public/figma/taxi.png";
import importIcon from "@/public/figma/import.png";
import ChallengeSolution from "@/components/ui/ChallengeSolution/ChallengeSolution";
import UseCaseGallery from "@/components/ui/UseCaseGallery/UseCaseGallery";
import ProcessSteps from "@/components/ui/ProcessSteps/ProcessSteps";
import FeatureSection from "@/components/ui/FeatureSection/FeatureSection";
import DownloadBanner from "@/components/ui/DownloadBanner/DownloadBanner";
import driverImage from "@/public/figma/b2bDriver.png";
import FAQ, { FAQItem } from "@/components/ui/Faq/Faq";
import FutureTransportBanner from "@/components/ui/FutureTransportBanner/FutureTransportBanner";
import Footer from "@/components/ui/footer/Footer";
export const tripFaqItems: FAQItem[] = [
  {
    question: "خدمات حمل‌ونقل سازمانی برای چه نوع سازمان‌هایی مناسب است؟",
    answer:
      "برای سازمان‌ها و شرکت‌هایی که به سفر منظم کارکنان، مدیران، مهمانان یا تیم‌های کاری نیاز دارند.",
  },
  {
    question: "آیا سرویس بر اساس نیاز سازمان قابل تنظیم است؟",
    answer:
      "بله. ساختار سرویس می‌تواند متناسب با نیاز هر سازمان، تعداد کاربران، نوع درخواست، زمان‌بندی، مسیرها و مدل همکاری تنظیم شود.",
  },
  {
    question: "آیا می‌توان برای چند مسیر مختلف سرویس تعریف کرد؟",
    answer:
      "بله. امکان تعریف چند مسیر و برنامه سرویس مختلف متناسب با نیاز سازمان وجود دارد و هر مسیر می‌تواند بر اساس شرایط عملیاتی مجموعه مدیریت شود.",
  },
  {
    question: "آیا امکان استفاده از خودرو در اختیار وجود دارد؟",
    answer:
      "بله. سازمان‌ها می‌توانند متناسب با نیاز خود از سرویس خودرو در اختیار استفاده کنند و خودرو و راننده را برای بازه زمانی مشخص در اختیار داشته باشند.",
  },
  {
    question: "هزینه خدمات سازمانی چگونه محاسبه می‌شود؟",
    answer:
      "هزینه خدمات سازمانی متناسب با نوع سرویس، حجم درخواست، مدت‌زمان استفاده و مسیرها تعیین می‌شود و بر اساس مدل همکاری هر مجموعه تعریف خواهد شد.",
  },

  {
    question:"برای شروع همکاری چه اطلاعاتی لازم است؟",
    answer:"در مرحله نخست، کافی است سازمان اطلاعات مربوط به نوع خدمات موردنیاز، حجم تقریبی سرویس، مسیرها، زمان‌بندی و شرایط مورد انتظار را ارائه کند تا راهکار مناسب بررسی و پیشنهاد شود."
  },
  
  {
    question:"چگونه می‌توانم درخواست همکاری سازمانی ثبت کنم؟",
    answer:"برای شروع همکاری، به بخش درخواست مشاوره مراجعه کنید تا با تیم دات‌وان تریپ ارتباط بگیرید."
  },
];
export default function page() {
  return (
    <>
      <Header />
      <div className="mt-16 md:mt-20 lg:mt-24">
  <Hero
        badge={{
          text: "در اختیار",
          icon: dotIcon,
        }}
        title={{
          highlight: "خودرو  راننده",
          text: "در اختیار شما",
        }}
        description="برای زمانی که به خودرو و راننده اختصاصی در طول چند ساعت یا یک بازه مشخص نیاز دارید، خودرو در اختیار دات‌وان تریپ را درخواست کنید."
        buttons={[
          {
            text: "درخواست سفر",
            icon: taxiIcon,
            variant: "primary",
            href: "https://app.trip.dotone.ir",
          },
          {
            text: "دانلود اپلیکیشن",
            icon: importIcon,
            variant: "secondary",
            href: "/b2b/#download-banner",
          },
        ]}
        image={{
          src: HeroImage,
          alt: "سفر شهری دات‌وان تریپ",
          width: 1080,
          height: 600,
        }}
      />
      <ChallengeSolution />
      <UseCaseGallery />
      <ProcessSteps ctaHref="/contact-us"/>
      <FeatureSection
        imageSide="right"
        title="اگر سفر بخشی از عملیات شماست، این سرویس برای شماست"
        image={{
          src: driverImage,
          alt: "راننده دات‌وان تریپ",
          width: 720,
          height: 480,
        }}
        features={[
          {
            title: "شرکت‌ها و سازمان‌ها",
            description:
              "برای مجموعه‌هایی با تعداد بالای کارکنان یا نیاز مستمر به سفر.",
          },
          {
            title: "شرکت‌های دارای شیفت کاری",
            description:
              "برای سازمان‌هایی که کارکنان در ساعات یا شیفت‌های مختلف جابه‌جا می‌شوند.",
          },
          {
            title: "شرکت‌های دارای شیفت کاری",
            description:
              " برای مجموعه‌هایی که کارکنان یا تیم‌ها بین چند محل کاری رفت‌وآمد دارند.",
          },
          {
            title: "سازمان‌های دارای مأموریت‌های کاری",
            description:
              "رای مجموعه‌هایی که سفر کارکنان بخشی از فعالیت روزانه آنهاست.",
          },
          {
            title: "سازمان‌های برگزارکننده رویداد",
            description: "برای سفر مهمانان، کارکنان یا تیم‌های اجرایی.",
          },
        ]}
      />
      <div style={{ marginTop: "200px" }}>
        <DownloadBanner />
      </div>
      <FAQ
        subtitle="آشنایی با دات‌وان تریپ"
        title="سؤالات متداول"
        description="پاسخ سوالاتی که ممکن است قبل از استفاده از خدمات دات‌وان تریپ برای شما ایجاد شود."
        items={tripFaqItems}
      />
      <FutureTransportBanner />
      </div>
    
      <Footer />
    </>
  );
}
