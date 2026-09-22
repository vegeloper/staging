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
      question: "از چه راه‌هایی می‌تونم رزومه‌ی خودم رو برای موقعیت",
      answer:
        "تبلیغات شما روی نمایشگر داخل خودرو و در طول سفر مسافر نمایش داده می‌شود. کمپین‌ها قابلیت زمان‌بندی، هدف‌گیری منطقه‌ای و دریافت گزارش عملکرد را دارند.",
    },
    {
      question: "آیا می‌توانم موقعیت خودرو را در طول سفر ببینم؟",
      answer:
        "بله، پس از تأیید سفر توسط راننده، می‌توانید موقعیت لحظه‌ای خودرو را روی نقشه اپلیکیشن مشاهده کنید.",
    },
    {
      question: "رانندگان دات‌وان چگونه انتخاب می‌شوند؟",
      answer:
        "رانندگان پس از احراز هویت، ارزیابی سوابق، آموزش و تأیید صلاحیت وارد ناوگان می‌شوند.",
    },
    {
      question: "خودروهای دات‌وان چه ویژگی‌هایی دارند؟",
      answer:
        "بخش بزرگی از ناوگان دات‌وان تریپ از خودروهای برقی و هیبریدی کم‌آلاینده تشکیل شده است.",
    },
    {
      question: "دات‌وان در چه شهرهایی فعال است؟",
      answer:
        "دات‌وان تریپ خدمات خود را به‌صورت مرحله‌ای توسعه می‌دهد. برای مشاهده شهرهای فعال، فهرست به‌روز را بررسی کنید.",
    },
  ];
  return (
    <>
      <Header />
      <div className="mt-12 md:mt-15 lg:mt-25">
        <CampaignHero
          posterSrc="/videos/campainVideoPoster.png"
          videoSrc="/videos/campainHero.mp4"
        />
      </div>
      <Car/>
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
      <Footer/>
    </>
  );
}
