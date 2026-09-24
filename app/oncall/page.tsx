import Hero from "@/components/ui/Hero/HeroDynamic";
import React from "react";
import dotIcon from "@/public/figma/dot.png";
import taxiIcon from "@/public/figma/taxi.png";
import importIcon from "@/public/figma/import.png";
import heroImage from "@/public/figma/oncallhero.png";
import driverImage from "@/public/figma/drivers.png";
import FeatureSection from "@/components/ui/FeatureSection/FeatureSection";
import DownloadBanner from "@/components/ui/DownloadBanner/DownloadBanner";
import FAQ, { FAQItem } from "@/components/ui/Faq/Faq";
import FutureTransportBanner from "@/components/ui/FutureTransportBanner/FutureTransportBanner";
import Footer from "@/components/ui/footer/Footer";
import Header from "@/components/ui/Header/Header";
import FlexibleTravel from "@/components/ui/FlexibleTravel/FlexibleTravel";
import oncall1 from "@/public/figma/oncall1.png";
import oncall2 from "@/public/figma/oncall2.png";
import oncall3 from "@/public/figma/oncall3.png";

export const tripFaqItems: FAQItem[] = [
  {
    question: "خودرو در اختیار چه تفاوتی با سفر معمولی دارد؟",
    answer:
      "در سفر معمولی، سرویس برای سفر از یک مبدأ به یک مقصد درخواست می‌شود. در خودرو در اختیار، خودرو و راننده برای یک بازه زمانی مشخص در اختیار شما قرار می‌گیرند.",
  },
  {
    question: "خودرو در اختیار برای چند ساعت قابل درخواست است؟",
    answer:
      "سرویس در اختیار را می‌توانید متناسب با نیاز خود، تا سقف ۸ ساعت درخواست کنید.",
  },
  {
    question: "آیا می‌توانم چند مقصد داشته باشم؟",
    answer:
      "در سرویس در اختیار، مقصد مشخصی هنگام ثبت درخواست تعیین نمی‌شود. خودرو در بازه زمانی انتخاب‌شده در اختیار شماست و می‌توانید سفر‌های موردنیاز خود را در طول مدت سرویس انجام دهید.",
  },
  {
    question: "آیا راننده در تمام مدت سرویس همراه من است؟",
    answer:
      "بله. راننده در تمام بازه زمانی ثبت‌شده همراه شماست و خودرو تا پایان مدت سرویس در اختیار شما قرار دارد.",
  },
  {
    question: "هزینه خودرو در اختیار چگونه محاسبه می‌شود؟",
    answer:
      "هزینه سرویس بر اساس مدت‌زمانی که هنگام ثبت درخواست انتخاب می‌کنید و مطابق با تعرفه سرویس در اختیار محاسبه و نمایش داده می‌شود.",
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
            highlight: "خودرو و راننده",
            text: "،در اختیار شما",
          }}
          description="برای هر زمانی که خودرو و راننده اختصاصی در طول چند ساعت یا یک بازه مشخص نیاز دارید، خوردو در اختیار دات وان تریپ را درخواست کنید"
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
              href: "/oncall/#download-banner",
            },
          ]}
          image={{
            src: heroImage,
            alt: "سفر شهری دات‌وان تریپ",
            width: 1080,
            height: 600,
          }}
        />
        <FeatureSection
          imageSide="right"
          title="خودرو در اختیار؛ سفر بدون محدودیت یک مسیر مشخص"
          description="در سرویس خودرو در اختیار، خودرو به همراه راننده برای مدت مشخص در اختیار شما قرار می‌گیرد.به‌جای درخواست یک سفر از مبدأ به مقصد، می‌توانید در بازه زمانی تعیین‌شده از خودرو برای سفر بین چند مقصد استفاده کنید."
          image={{
            src: oncall1,
            alt: "راننده دات‌وان تریپ",
            width: 720,
            height: 480,
          }}
          featTitle="سه ویژگی کلیدی"
          features={[
            {
              title: "خودرو اختصاصی",
              description: "خودرو در طول زمان سرویس در اختیار شماست.",
            },
            {
              title: "راننده همراه",
              description:
                "رانندگان احراز هویت‌شده و آموزش‌دیده، همراه با نظارت بر سفر.",
            },
            {
              title: "انعطاف در جا‌به‌جایی",
              description:
                "امکان برنامه‌ریزی برای چند توقف و مقصد در طول سرویس.",
            },
          ]}
        />
        <FeatureSection
          imageSide="left"
          title="وقتی یک سفر معمولی کافی نیست"
          description="اگر برنامه شما شامل چند مقصد، توقف‌های متعدد یا رفت‌وآمد در یک بازه زمانی مشخص است، خودرو در اختیار می‌تواند انتخاب مناسب‌تری باشد."
          image={{
            src: oncall2,
            alt: "راننده دات‌وان تریپ",
            width: 720,
            height: 480,
          }}
          features={[
            {
              title: "جلسات و برنامه‌های کاری",
              description: "برای رفت‌وآمد بین چند جلسه یا محل کاری در طول روز.",
            },
            {
              title: "مأموریت‌های چندمقصدی",
              description:
                "وقتی در یک بازه زمانی باید به چند مکان مختلف مراجعه کنید.",
            },
            {
              title: "برنامه‌های تشریفاتی و مهمانان",
              description:
                "برای سفر مهمانان، مدیران یا تیم‌های کاری با برنامه مشخص.",
            },
            {
              title: "برنامه‌های شهری طولانی",
              description:
                " زمانی که نمی‌خواهید برای هر سفر یک سفر جداگانه درخواست کنید.",
            },
          ]}
        />
        <FeatureSection
          imageSide="right"
          title="از درخواست تا پایان سرویس"
          image={{
            src: oncall3,
            alt: "راننده دات‌وان تریپ",
            width: 720,
            height: 480,
          }}
          featTitle="مراحل:"
          features={[
            {
              title: "ثبت درخواست",
              description:
                "مبدأ و مدت زمان مورد نیاز برای استفاده از سرویس را مشخص کنید و درخواست خود را ثبت نمایید.",
            },
            {
              title: "بررسی و هماهنگی",
              description:
                "پس از ثبت درخواست،سیستم به صورت خودکار راننده مناسب را برای سرویس شما انتخاب و تخصیص می دهد.",
            },
            {
              title: "تخصیص خودرو و راننده",
              description:
                " در زمان تعیین‌شده، خودرو و راننده در محل موردنظر شما حاضر می‌شوند.",
            },
            {
              title: "استفاده در بازه تعیین شده",
              description:
                "در طول مدت سرویس می‌توانید طبق برنامه خود از خودرو برای سفر استفاده کنید.",
            },
          ]}
        />
        <FlexibleTravel />
        <DownloadBanner />
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
