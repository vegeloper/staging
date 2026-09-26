import AdvertisingRequest from "@/components/ui/campain/AdvertisingRequest/AdvertisingRequest";
import AdvertisingGrid from "@/components/ui/campain/AdvertisingSection/AdvertisingGrid/AdvertisingGrid";
import CampaignFeatureSection from "@/components/ui/campain/CampaignFeatureSection/CampaignFeatureSection";
import { CampaignHero } from "@/components/ui/campain/CampaignHero";
import TripCounterHero from "@/components/ui/campain/CounterBanner/TripCounterHero";
import Header from "@/components/ui/Header/Header";
import React from "react";
import advertisingCarImage from "@/public/figma/car3.png";
import AdvertisingComparison, {
  ComparisonColumn,
  ComparisonRow,
} from "@/components/ui/campain/AdvertisingComparison/AdvertisingComparison";
import FAQ, { FAQItem } from "@/components/ui/Faq/Faq";
import Footer from "@/components/ui/footer/Footer";
import Car from "@/components/ui/campain/car/Car";
// import TripCarViewer from "@/components/ui/campain/car/TripCarViewer";
export default function page() {
  //fake data for table
  const comparisonColumns: ComparisonColumn[] = [
    {
      key: "billboard",
      label: "بیلبوردها",
    },
    {
      key: "social",
      label: "شبکه‌های اجتماعی",
    },
    {
      key: "dotOne",
      label: "نمایشگر دات‌وان تریپ",
    },
  ];

  const comparisonRows: ComparisonRow[] = [
    {
      feature: "مدت زمان مشاهده",

      values: {
        billboard: "۳ تا ۵ ثانیه",
        social: "۱ تا ۳ ثانیه",
        dotOne: "۲۰ تا ۷۵ دقیقه",
      },
    },

    {
      feature: "تمرکز مخاطب",

      values: {
        billboard: "محدود",
        social: "متوسط",
        dotOne: "بسیار بالا",
      },
    },

    {
      feature: "هدف‌گیری منطقه‌ای",

      values: {
        billboard: "محدود",
        social: "متوسط",
        dotOne: "دقیق",
      },
    },

    {
      feature: "QR Code و تعامل مستقیم",

      values: {
        billboard: "محدود",
        social: "دارد",
        dotOne: "دارد",
      },
    },

    {
      feature: "گزارش و آمار کمپین",

      values: {
        billboard: "ندارد",
        social: "دارد",
        dotOne: "کامل",
      },
    },
  ];
  //fake data for faq
  const tripFaqItems: FAQItem[] = [
    {
      question: "تبلیغات روی نمایشگرهای دات‌وان چگونه نمایش داده می‌شود؟",
      answer:
        "تبلیغات شما روی نمایشگر داخل خودرو و در طول سفر مسافر نمایش داده می‌شود. کمپین‌ها قابلیت زمان‌بندی، هدف‌گیری منطقه‌ای و دریافت گزارش عملکرد را دارند.",
    },
    {
      question: "حداقل مدت زمان اجرای کمپین چقدر است؟",
      answer:
        "مدت اجرای هر کمپین متناسب با نوع محتوا، محدوده پوشش و برنامه اکران تعیین می‌شود. جزئیات زمان‌بندی پس از مشخص شدن نیاز و شرایط کمپین اعلام خواهد شد.",
    },
    {
      question: "آیا امکان انتخاب مناطق خاص برای نمایش تبلیغ وجود دارد؟",
      answer: "بله. متناسب با محدوده فعالیت ناوگان و شرایط کمپین، امکان تعریف هدف‌گیری جغرافیایی و انتخاب مناطق موردنظر برای نمایش تبلیغات وجود دارد.",
    },
    {
      question: "گزارش آمار بازدید و اسکن QR Code چگونه ارائه می‌شود؟",
      answer: "پس از اجرای کمپین، گزارش عملکرد شامل آمار مرتبط با نمایش تبلیغ و تعاملات ثبت‌شده از طریق QR Code در اختیار سفارش‌دهنده قرار می‌گیرد تا امکان ارزیابی عملکرد کمپین فراهم باشد.",
    },
    {
      question: "چه فرمت‌هایی برای محتوای تبلیغاتی قابل قبول است؟",
      answer: "محتوای تبلیغاتی می‌تواند در قالب ویدئو، تصویر و محتوای گرافیکی ارائه شود. مشخصات فنی و ابعاد موردنیاز متناسب با ساختار نمایشگرهای دات‌وان در اختیار سفارش‌دهنده قرار خواهد گرفت.",
    },
    {
      question: "آیا می‌توان چند کمپین را به‌صورت همزمان اجرا کرد؟",
      answer: "بله. امکان اجرای همزمان چند کمپین با برنامه‌ریزی و زمان‌بندی مستقل وجود دارد و هر کمپین می‌تواند متناسب با محدوده، زمان و شرایط موردنظر مدیریت شود.",
    },
  ];
  return (
    <>
      <Header />
      <div className="mt-16 md:mt-20 lg:mt-24">
        <CampaignHero />
      </div>
      <Car />
      {/* <TripCarViewer /> */}
      <CampaignFeatureSection />
      <TripCounterHero count={46519} backgroundImage="/figma/sky.png" />
      <AdvertisingGrid />
      <AdvertisingRequest
        id="advertising-request"
        image={advertisingCarImage}
      />
      <AdvertisingComparison
        eyebrow="جدول مقایسه"
        title="مقایسه انواع تبلیغات با دات‌وان تریپ"
        columns={comparisonColumns}
        rows={comparisonRows}
        highlightColumn="dotOne"
      />
      <FAQ
        description="تبلیغات روی نمایشگرهای دات‌وان چگونه نمایش داده می‌شود؟"
        title="سؤالات متداول"
        items={tripFaqItems}
      />
      <Footer />
    </>
  );
}
