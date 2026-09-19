import Header from "@/components/ui/Header/Header";
import HeroDynamic from "@/components/ui/Hero/HeroDynamic";
import React from "react";
import taxiIcon from "@/public/figma/taxi.png";
import heroImage from "@/public/figma/serviceHeroImage.png";
import importIcon from "@/public/figma/import.png";
import dotIcon from "@/public/figma/dot.png";
import FeatureSection from "@/components/ui/FeatureSection/FeatureSection";
import driverImage from "@/public/figma/drivers.png";
import TripExperience from "@/components/ui/TripExperience/TripExperience";
import DownloadBanner from "@/components/ui/DownloadBanner/DownloadBanner";
import FAQ, { FAQItem } from "@/components/ui/Faq/Faq";
import CoverageMap from "@/components/ui/CoverageMap/CoverageMap";
import FutureTransportBanner from "@/components/ui/FutureTransportBanner/FutureTransportBanner";
import Footer from "@/components/ui/footer/Footer";
// import PopularArticles from "@/components/ui/PopularArticles/PopularArticles";
export const tripFaqItems: FAQItem[] = [
  {
    question: "چطور می‌توانم با دات‌وان سفر کنم؟",
    answer:
      " از طریق اپلیکیشن دات‌وان، مبدأ و مقصد خود را مشخص و درخواست سفر را ثبت کنید.",
  },
  {
    question: "آیا می‌توانم موقعیت خودرو را در طول سفر ببینم؟",
    answer:
      "بله. پس از تخصیص خودرو، می‌توانید موقعیت خودرو و روند سفر را از طریق اپلیکیشن دات‌وان تریپ دنبال کنید.",
  },
  {
    question: "رانندگان دات‌وان تریپ چگونه انتخاب می‌شوند؟",
    answer:
      "رانندگان دات‌وان پیش از شروع فعالیت، طی فرآیند مشخصی شامل بررسی مدارک، ارزیابی، احراز صلاحیت و آموزش انتخاب می‌شوند. عملکرد رانندگان نیز در طول فعالیت به‌صورت مستمر پایش می‌شود.",
  },
  {
    question: "خودروهای دات‌وان چه ویژگی‌هایی دارند؟",
    answer:
      "ناوگان دات‌وان تریپ شامل خودروهای مدرن برقی و هیبریدی است که با تمرکز بر کیفیت، ایمنی و تجربه بهتر سفر انتخاب شده‌اند. بخشی از خودروها به دوربین داخل کابین و نمایشگرهای دیجیتال برای ارائه محتوای سرگرمی، اطلاع‌رسانی و تبلیغات مجهز هستند.",
  },
  {
    question: "دات‌وان در چه شهرهایی فعال است؟",
    answer:
      "دات‌وان تریپ در حال حاضر در کرج، اروند و چابهار فعالیت دارد و توسعه خدمات در تهران و سایر شهرها نیز در برنامه توسعه مجموعه قرار گرفته است.",
  },
];
export default function page() {
  return (
    <>
      <Header variant="light" />
      {/* <Hero/> */}
      <div className="mt-16 md:mt-20 lg:mt-24">
      <HeroDynamic
        badge={{
          text: "سفر شهری",
          icon: dotIcon,
        }}
        title={{
          highlight: "سفرهای شهری",
          text: "ساده‌تر از همیشه",
        }}
        description="با دات‌وان تریپ، برای رفت‌وآمد روزمره روی سفری راحت، امن و قابل‌اعتماد حساب کنید."
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
            href: "/services/#download-banner",
          },
        ]}
        image={{
          src: heroImage,
          alt: "سفر شهری دات‌وان تریپ",
          width: 1080,
          height: 600,
        }}
      />
      </div>
      <FeatureSection
        imageSide="right"
        title="برای هر مسیر شهری، یک تجربه بهتر"
        description="دات‌وان تریپ با ترکیب خودروهای مدرن، رانندگان آموزش‌دیده و فناوری هوشمند، سفرهای شهری را مدیریت می‌کند."
        image={{
          src: driverImage,
          alt: "راننده دات‌وان تریپ",
          width: 720,
          height: 480,
        }}
        featTitle="مزیت ها"
        features={[
          {
            title: "راحتی",
            description: "خودروهای مناسب و محیطی آرام برای یک سفر راحت‌تر.",
          },
          {
            title: "امنیت",
            description:
              "رانندگان احراز هویت‌شده و آموزش‌دیده، همراه با نظارت بر سفر.",
          },
          {
            title: "شفافیت",
            description:
              "اطلاعات سفر و مسیر، از شروع تا پایان در اختیار شماست.",
          },
        ]}
      />
      <TripExperience />
      <FeatureSection
        imageSide="left"
        title="چرا سفر شهری با دات‌وان؟"
        description=""
        image={{
          src: driverImage,
          alt: "راننده دات‌وان تریپ",
          width: 720,
          height: 480,
        }}
        features={[
          {
            title: "راحتی بیشتر",
            description: "خودروهای مدرن و محیطی مناسب برای رفت‌وآمدهای روزمره.",
          },
          {
            title: "رانندگان آموزش‌دیده",
            description:
              "رانندگانی که پیش از شروع همکاری، مراحل احراز هویت، ارزیابی و آموزش را پشت سر گذاشته‌اند.",
          },
          {
            title: "امنیت در طول سفر",
            description: "پایش مسیر و موقعیت خودرو برای تجربه سفری مطمئن‌تر.",
          },
          {
            title: "مدیریت هوشمند سفر",
            description:
              "فناوری دات‌وان، اطلاعات و مراحل سفر را از درخواست تا پایان مدیریت می‌کند.",
          },
        ]}
      />
      {/* <VehicleShowcase/>
    <ChallengeSolution/>
    <UseCaseGallery/>
    <ProcessSteps/> */}
      <CoverageMap />
      <DownloadBanner />
      <FAQ
        subtitle="آشنایی با دات‌وان تریپ"
        title="سؤالات متداول"
        description="پاسخ سوالاتی که ممکن است قبل از استفاده از خدمات دات‌وان تریپ برای شما ایجاد شود."
        items={tripFaqItems}
      />
      <FutureTransportBanner />
      <Footer />
    </>
  );
}
