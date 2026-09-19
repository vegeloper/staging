import React from "react";

import Header from "@/components/ui/Header/Header";
import TransportHero from "@/components/ui/about/Hero/TransportHero";
import FeatureSection from "@/components/ui/FeatureSection/FeatureSection";

import FeatureRow, {
  FeatureCard,
} from "@/components/ui/about/FeatureRow/FeatureRow";

import monitorImage from "@/public/figma/monitor.png";
import monitoringImage from "@/public/figma/monitoring.png";
import tripCarImage from "@/public/figma/Tripcar.png";
import sessionImage from "@/public/figma/oneSession.png";
import carTrip2 from "@/public/figma/carTrip2.png";

import InnovationSection, {
  InnovationCard,
} from "@/components/ui/about/InnovationSection/InnovationSection";
import EcosystemSection, {
  EcosystemItem,
} from "@/components/ui/about/EcosystemSection/EcosystemSection";
import DownloadBanner from "@/components/ui/DownloadBanner/DownloadBanner";
import Footer from "@/components/ui/footer/Footer";
import FutureTransportBanner from "@/components/ui/FutureTransportBanner/FutureTransportBanner";

const firstRowCards: FeatureCard[] = [
  {
    image: monitoringImage,
    title: "فناوری",
    description: "استفاده از راهکارهای هوشمند برای مدیریت و بهبود خدمات",
  },
  {
    image: tripCarImage,
    title: "تجربه‌محوری",
    description: "طراحی خدمات بر اساس نیاز واقعی مسافر و راننده",
  },
];

const secondRowCards: FeatureCard[] = [
  {
    image: sessionImage,
    title: "پایداری",
    description: "حرکت به سمت حمل‌ونقل پاک‌تر و استفاده از ناوگان برقی",
  },
  {
    image: monitoringImage,
    title: "کیفیت و ایمنی",
    description: "اجرای استانداردهای مشخص برای ارائه خدمات قابل اعتماد",
  },
];
const innovationCards: InnovationCard[] = [
  {
    title: "ناوگان مدرن و متنوع",
    description:
      "دات‌وان تریپ از خودروهای نسل جدید، تمام‌برقی و هیبریدی در ناوگان خود بهره می‌گیرد. در حال حاضر عملیات مجموعه در کرج، اروند و چابهار فعال است و ساختار ناوگان در هر منطقه متناسب با شرایط عملیاتی همان بازار توسعه یافته است.",
    icon: "/figma/svgs/magic-wand.svg",
    iconAlt: "ناوگان مدرن",
    variant: "dark",
  },
  {
    title: "توسعه در مقیاس بزرگ",
    description:
      "در کنار توسعه شهرهای فعال، تهران یکی از محورهای اصلی برنامه توسعه دات‌وان تریپ است و توسعه ناوگان تا مقیاس ۱۵۰ هزار خودرو برای این بازار هدف‌گذاری شده است.",
    icon: "/figma/svgs/chart-increase.svg",
    iconAlt: "توسعه",
    variant: "light",
  },
  {
    title: "زیرساخت ایمنی داخل خودرو",
    description:
      "در کنار توسعه شهرهای فعال، تهران یکی از محورهای اصلی برنامه توسعه دات‌وان تریپ است و توسعه ناوگان تا مقیاس ۱۵۰ هزار خودرو برای این بازار هدف‌گذاری شده است.",
    icon: "/figma/svgs/security-check.svg",
    iconAlt: "امنیت",
    variant: "dark",
  },
  {
    title: "رسانه دیجیتال داخل ناوگان",
    description:
      "بخشی از خودروهای ناوگان به دوربین داخل کابین مجهز شده‌اند تا با رعایت الزامات حریم خصوصی، امکان بررسی دقیق‌تر رخدادها و ارتقای نظارت بر کیفیت و امنیت سفر فراهم شود.",
    icon: "/figma/svgs/computer-video.svg",
    iconAlt: "رسانه دیجیتال",
    variant: "light",
  },
];
const ecosystemItems: EcosystemItem[] = [
  {
    title: "پلتفرم مسافر",
    description: "ثبت و مدیریت درخواست سفر",
  },
  {
    title: "اپلیکیشن راننده",
    description: "دریافت، مدیریت و اجرای سفر",
  },
  {
    title: "مدیریت ناوگان",
    description: "کنترل خودرو و راننده، شیفت و وضعیت عملیاتی",
  },
  {
    title: "مرکز کنترل عملیات",
    description: "پایش سفرها و مدیریت رخدادهای عملیاتی",
  },
  {
    title: "داده و گزارش‌گیری",
    description: "تحلیل عملکرد سفر، خودرو و ناوگان",
  },
  {
    title: "خدمات سازمانی",
    description: "طراحی مدل حمل‌ونقل متناسب با نیاز هر سازمان",
  },
];
export default function Page() {
  return (
    <>
      <Header />

      <div className="mt-10 md:mt-16 lg:mt-20">
        <TransportHero />
      </div>

      <div style={{ marginBottom: "150px" }}>
        <FeatureSection
          imageSide="right"
          title="فراتر از یک سرویس درخواست خودرو"
          image={{
            src: monitorImage,
            alt: "راننده دات‌وان تریپ",
            width: 720,
            height: 480,
          }}
          subTitle="یک پلتفرم یکپارچه برای مدیریت چرخه سفر"
          description="دات‌وان تریپ صرفاً مسافر را به خودرو متصل نمی‌کند؛ بلکه تمام چرخه سفر، از ثبت درخواست و تخصیص خودرو تا کنترل عملیات، پشتیبانی، مدیریت ناوگان و تحلیل داده را در یک پلتفرم یکپارچه مدیریت می‌کند. این ساختار، امکان ارائه سرویس‌های اختصاصی به سازمان‌ها و مجموعه‌هایی را فراهم می‌کند که به کنترل، شفافیت و مقیاس‌پذیری بیشتر در مدیریت حمل‌ونقل نیاز دارند."
        />
      </div>
      <FeatureRow
        direction="right"
        title="ماموریت ما؛ ساختن تجربه‌ای بهتر از شهر"
        description="ما در تریپ به تجربه‌ای فکر می‌کنیم که با استفاده از فناوری و ناوگان مدرن، تجربه‌ای ایمن، پاکیزه و قابل اعتماد برای سفر ایجاد کنیم."
        cards={firstRowCards}
      />

      <FeatureRow
        direction="left"
        title="با رویکردی هوشمند، پایدار و انسان‌محور"
        description="از انتخاب و مدیریت ناوگان تا تجربه مسافر و همکاری با رانندگان، تلاش می‌کنیم هر بخش از زنجیره حمل‌ونقل را با استفاده از فناوری، داده و استانداردهای مشخص بهبود دهیم."
        cards={secondRowCards}
      />
      <div style={{ marginTop: "150px" }}>
        <FeatureSection
          imageSide="left"
          title="از سفر روزمره تا زیرساخت مدیریت حمل‌ونقل"
          image={{
            src: carTrip2,
            alt: "راننده دات‌وان تریپ",
            width: 720,
            height: 480,
          }}
          subTitle="حمل‌ونقل برای هر سازمان، یک شکل ندارد."
          description="دات‌وان تریپ با این نگاه شکل گرفت که الگوی حمل‌ونقل همه سازمان‌ها یکسان نیست؛ برخی مجموعه‌ها به مدیریت سفرهای روزانه کارکنان نیاز دارند، برخی به ناوگان اختصاصی و برخی به مدیریت یکپارچه حجم بالایی از سفرها. بر همین اساس، زیرساخت دات‌وان تریپ به‌گونه‌ای توسعه یافته است که متناسب با مدل فعالیت هر سازمان، طیفی از نیازها را از سفرهای موردی و سرویس کارکنان تا تأمین و مدیریت ناوگان اختصاصی پوشش دهد."
        />
      </div>

      <InnovationSection
        title="نوآوری برای نسل جدید حمل‌ونقل"
        subtitle="ترکیبی از ناوگان مدرن، فناوری و زیرساخت عملیاتی"
        cards={innovationCards}
      />
      <EcosystemSection
        title="همه اجزای سفر، در یک اکوسیستم یکپارچه"
        subtitle="از درخواست سفر تا مدیریت عملیات، اجزای مختلف در ارتباط با یکدیگر فعالیت می‌کنند."
        items={ecosystemItems}
      />
      <div className="md:mt-30">
        <DownloadBanner />
      </div>
      <FutureTransportBanner />
      <Footer />
    </>
  );
}
