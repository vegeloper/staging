import Header from "@/components/ui/Header/Header";
import AboutIntro from "@/components/ui/index/AboutIntro/AboutIntro";
import FleetFeature from "@/components/ui/index/FleetFeature/FleetFeature";
import modernFleetImage from "@/public/figma/car3.png";
import trainedDriversImage from "@/public/figma/trainedDriversImage.png";
import securiyImage from "@/public/figma/security.png";
import tripStartImage from "@/public/figma/journey.png";
import cityTransportImage from "@/public/figma/solutionImage1.png";
import intercityImage from "@/public/figma/solutionImage2.png";
import corporateImage from "@/public/figma/solutionImage3.png";
import specialServicesImage from "@/public/figma/solutionImage4.png";
import driversImage from "@/public/figma/recruiting.png";
import carSideView from "@/public/figma/vehicles/Car-SideView.svg";
import mainNewsImage from "@/public/figma/mainNewsImage.png";
import TripStartHero from "@/components/ui/index/TripStartHero/TripStartHero";
import news1Image from "@/public/figma/news-1.png";
import news2Image from "@/public/figma/news-2.png";
import news3Image from "@/public/figma/news-3.png";
import news4Image from "@/public/figma/news-4.png";

import IranCoverage, {
  CoverageItem,
} from "@/components/ui/index/IranCoverage/IranCoverage";
import iranMap from "@/public/figma/iran-map.png";
import { TravelSolutionCardProps } from "@/components/ui/index/TravelSolutions/TravelSolutionCard/TravelSolutionCard";
import TravelSolutions from "@/components/ui/index/TravelSolutions/TravelSolutions";
import JoinBanner from "@/components/ui/index/JoinBanner/JoinBanner";
import { CarFront } from "lucide-react";
import Footer from "@/components/ui/footer/Footer";
import VehicleShowcase from "@/components/ui/VehicleShowcase/VehicleShowcase";
import DownloadBanner from "@/components/ui/DownloadBanner/DownloadBanner";
import NewsSection, {
  NewsItem,
} from "@/components/ui/index/NewsSection/NewsSection";
import FutureTransportBanner from "@/components/ui/FutureTransportBanner/FutureTransportBanner";
import FAQ, { FAQItem } from "@/components/ui/Faq/Faq";
import Link from "next/link";
const A = "/figma/";
// faq data
export const tripFaqItems: FAQItem[] = [
  {
    question: "از چه راه‌هایی می‌تونم رزومه‌ی خودم رو برای موقعیت",
    answer:
      "دات‌وان تریپ خدمات خود را به‌صورت مرحله‌ای در شهرهای مختلف توسعه می‌دهد. برای مشاهده شهرهای فعال، فهرست به‌روز مناطق تحت پوشش را بررسی کنید.",
  },
  {
    question: "چطور می‌توانم از دات‌وان تریپ سفر بگیرم؟",
    answer:
      "در دات‌وان تریپ دو نوع سرویس دات‌وان و در اختیار ارائه می‌شود. در سرویس دات‌وان کافی است مبدا و مقصد خود را انتخاب و درخواست سفر را ثبت کنید. در سرویس در اختیار تنها مبدأ را مشخص می‌کنید و خودرو برای مدت موردنیاز در اختیار شما قرار می‌گیرد.",
  },
  {
    question: "آیا خودروهای دات‌وان تریپ برقی هستند؟",
    answer: "ناوگان دات‌وان تریپ شامل خودروهای برقی و هیبریدی نسل جدید است. توسعه ناوگان پاک و استفاده از خودروهای کم‌مصرف و سازگارتر با محیط‌زیست، یکی از محورهای اصلی توسعه مجموعه است.",
  },
  {
    question: "رانندگان دات‌وان تریپ چگونه انتخاب می‌شوند؟",
    answer: "رانندگان دات‌وان تریپ پیش از شروع فعالیت، طی فرآیند جذب، بررسی مدارک، ارزیابی، آموزش و احراز صلاحیت انتخاب می‌شوند. همچنین عملکرد رانندگان در طول فعالیت به‌صورت مستمر پایش می‌شود.",
  },
  {
    question: "چطور می‌توانم به‌عنوان راننده با دات‌وان تریپ همکاری کنم؟",
    answer: "متقاضیان همکاری می‌توانند از طریق مراجعه به بخش همکاری با دات وان تریپ درخواست خود را ثبت کنند. پس از بررسی اولیه، مراحل ارزیابی، احراز صلاحیت و آموزش انجام خواهد شد.",
  },
  {
    question: "آیا امکان خرید خودرو و همکاری با دات‌وان تریپ وجود دارد؟",
    answer: "دات‌وان تریپ برای متقاضیان، طرح‌های مشارکت و همکاری در نظر گرفته است. برای مشاهده شرایط، ثبت درخواست و دریافت اطلاعات بیشتر می‌توانید به سایت apply.dotone.ir مراجعه کنید.",
  },
];
// FleetFeature data
const news = [
  [
    "news-1.png",
    "آغاز بهره‌برداری از هاب مرکزی «دات‌وان تریپ» در کرج؛ زیرساختی مدرن برای حمل‌ونقل پاک",
  ],
  ["news-2.png", "اختلالات موقتی در برخی سرویس‌های حمل‌ونقل شهری در البرز"],
  [
    "news-3.png",
    "رئیس شورای عالی استان‌ها: عدم حمایت از سرمایه‌گذار، خیانت به کشور است",
  ],
  ["news-4.png", "آغاز بهره‌برداری از هاب مرکزی دات‌وان تریپ در کرج"],
];

const modernFleetItems = [
  {
    text: "خودروهای برقی و هیبریدی با آلایندگی کمتر",
  },
  {
    text: "کابین تمیز، مدرن و مجهز برای آسایش بیشتر",
  },
  {
    text: "سرویس و نگهداری دوره‌ای مطابق استاندارد ناوگان",
  },
];

const trainedDriverItems = [
  {
    text: "احراز هویت و بررسی سوابق پیش از شروع همکاری",
  },
  {
    text: "آموزش رفتار حرفه‌ای و اصول ارتباط با مسافر",
  },
  {
    text: "آشنایی با استانداردهای ایمنی و خدمات سفر",
  },
];

const securiyItems = [
  {
    text: "پایش لحظه‌ای موقعیت خودرو و مسیر سفر",
  },
  {
    text: "ثبت کامل جزئیات و تاریخچه هر سفر",
  },
  {
    text: "افزایش امنیت از طریق مانیتورینگ و کنترل ناوگان",
  },
];
//coverage cars in iran data
const coverageItems: CoverageItem[] = [
  {
    city: "تهران",
    value: 1997,
  },
  {
    city: "کرج",
    value: 1498,
  },
  {
    city: "خوزستان",
    value: 997,
  },
  {
    city: "اصفهان",
    value: 823,
  },
  {
    city: "گلستان",
    value: 657,
  },
  {
    city: "مازندران",
    value: 598,
  },
  {
    city: "یزد",
    value: 416,
  },
  {
    city: "کردستان",
    value: 254,
  },
  {
    city: "بندر عباس",
    value: 166,
  },
];
// solutions
const solutionCards: TravelSolutionCardProps[] = [
  {
    title: "حمل‌ونقل شهری",

    description:
      "برای سفرهای روزمره شهری، با خودروهای مدرن و رانندگان آموزش‌دیده.",

    image: cityTransportImage,

    imageAlt: "حمل‌ونقل شهری دات‌وان تریپ",

    buttonText: "مشاهده سرویس",

    buttonHref: "/services",
  },

  {
    title: "سفرهای بین‌شهری",

    description:
      "راهکاری مطمئن برای سفرهای بین‌شهری با تمرکز بر راحتی، امنیت و کیفیت تجربه سفر.",

    image: intercityImage,

    imageAlt: "سفرهای بین‌شهری دات‌وان تریپ",

    /*
      این کارت دکمه ندارد
      و فقط badge نمایش داده می‌شود.
    */
    badge: "به‌زودی",
  },

  {
    title: "حمل‌ونقل سازمانی",

    description:
      "مدیریت یکپارچه سفرهای کارکنان و سرویس‌های سازمانی با امکان کنترل و پایش عملکرد.",

    image: corporateImage,

    imageAlt: "حمل‌ونقل سازمانی دات‌وان تریپ",

    buttonText: "درخواست مشاوره",

    buttonHref: "/b2b",
  },

  {
    title: "خدمات اختصاصی",

    description:
      "اگر نیاز شما متفاوت است، با توجه به نیاز سازمان و شرایط عملیاتی، راهکار اختصاصی ارائه می‌شود.",

    image: specialServicesImage,

    imageAlt: "خدمات اختصاصی دات‌وان تریپ",

    buttonText: "با ما در ارتباط باشید",

    buttonHref: "/oncall",
  },
];

//news data

const featuredNews: NewsItem = {
  id: "featured-news",

  title:
    "بهره‌برداری رسمی از ناوگان تاکسی‌های هوشمند دات‌وان در کرج با حضور مهندس بابک زنجانی",

  description:
    "مهندس زنجانی با اشاره به نقش حیاتی هوشمندسازی ناوگان، بر توسعه خدمات حمل‌ونقل مدرن و ایجاد تجربه‌ای متفاوت برای شهروندان تأکید کرد.",

  date: "۲۴ آذر ۱۴۰۴",

  category: "دات وان تریپ",

  image: mainNewsImage,

  href: "/news/featured",

  buttonText: "مشاهده خبر",
};

const newsData: NewsItem[] = [
  {
    id: "news-1",

    title:
      "آغاز بهره‌برداری از هزار تاکسی دات‌وان تریپ در کرج؛ زیرساختی مدرن برای حمل‌ونقل پاک",

    date: "۵ آذر ۱۴۰۴",

    image: news1Image,

    href: "/news/1",
  },

  {
    id: "news-2",

    title: "اختلالات موقتی در برخی سرویس‌های حمل و نقل شهری در البرز",

    date: "۵ آذر ۱۴۰۴",

    image: news2Image,

    href: "/news/2",
  },

  {
    id: "news-3",

    title:
      "رئیس شورای عالی استان‌ها: عدم حمایت از سرمایه‌گذار، خیانت به کشور است",

    date: "۵ آذر ۱۴۰۴",

    image: news3Image,

    href: "/news/3",
  },

  {
    id: "news-4",

    title:
      "آغاز بهره‌برداری از هزار تاکسی دات‌وان تریپ در کرج؛ زیرساختی مدرن برای حمل‌ونقل پاک",

    date: "۵ آذر ۱۴۰۴",

    image: news4Image,

    href: "/news/4",
  },
];

function BrandButton({
  children,
  subtle = false,
}: {
  children: React.ReactNode;
  subtle?: boolean;
}) {
  return (
    <button className={subtle ? "button button-subtle" : "button button-brand"}>
      {children}
    </button>
  );
}
function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <main dir="rtl">
      <section className="hero" id="home">
        <img
          className="hero-bg"
          src={`${A}hero-bg.png`}
          alt="خودروی دات‌وان تریپ"
        />

        <Header variant="dark" />
        <div className="hero-content">
          <h1>
            نسل جدید حمل‌ونقل،
            <br />
            <span>همین‌جاست</span>
          </h1>
          <p>
            با دات‌وان تریپ تجربه‌ای متفاوت از جابه‌جایی شهری و بین‌شهری را
            تجربه کنید؛ با ناوگان برقی، رانندگان آموزش‌دیده و فناوری‌ای که سفر
            را ساده‌تر، امن‌تر و هوشمندتر می‌کند.
          </p>
          <div className="hero-buttons">
            <BrandButton>
              <CarFront size={18} /> درخواست سفر
            </BrandButton>
            <Link href={"/about"}>
              <BrandButton subtle>درباره دات‌وان تریپ</BrandButton></Link>
          </div>
        </div>
        <div className="hero-stats">
          <div>
            <strong>+۱٬۲۵۰</strong>
            <span>تعداد رانندگان فعال</span>
          </div>
          <div>
            <strong>+۱۵۰٬۰۰۰</strong>
            <span>سفرهای انجام شده</span>
          </div>
        </div>
      </section>
      <AboutIntro
        badge="درباره دات‌وان تریپ"
        title={`دات‌وان تریپ؛
تجربه‌ای تازه در حمل‌ونقل`}
        description={
          <>
            <strong>دات‌وان تریپ</strong> یک پلتفرم حمل‌ونقل مدرن است که با
            ترکیب <strong>ناوگان برقی، فناوری و نیروی</strong>
            <br />
            <strong>انسانی آموزش‌دیده،</strong> تجربه‌ای متفاوت از سفر را برای
            مسافران و سازمان‌ها ایجاد می‌کند.
            <br />
            ما در تریپ تلاش می‌کنیم حمل‌ونقل را از یک سفر ساده، به{" "}
            <strong>تجربه‌ای ایمن، راحت، سریع و</strong>
            <br />
            <strong>قابل اعتماد تبدیل کنیم.</strong> از انتخاب خودرو و مدیریت
            سفر تا پشتیبانی و کنترل کیفیت، همه
            <br />
            چیز با هدف ایجاد یک تجربه بهتر طراحی شده است.
          </>
        }
      />
      <FleetFeature
        imageSide="right"
        image={modernFleetImage}
        imageAlt="خودروی ناوگان دات‌وان تریپ"
        title="ناوگان مدرن"
        description="خودروهای دات‌وان از نسل جدید خودروهای برقی و هیبریدی انتخاب شده‌اند تا تجربه‌ای آرام، ایمن و سازگار با محیط‌زیست را برای مسافران فراهم کنند. تمام خودروها به‌صورت یکپارچه تحت مدیریت ناوگان نگهداری و سرویس می‌شوند."
        items={modernFleetItems}
        buttonText="مشاهده ناوگان"
        buttonHref="/vehicles"
      />
      <FleetFeature
        imageSide="left"
        image={trainedDriversImage}
        imageAlt="رانندگان آموزش‌دیده دات‌وان تریپ"
        title="رانندگان آموزش‌دیده"
        description="رانندگان دات‌وان تنها بر اساس داشتن گواهینامه انتخاب نمی‌شوند؛ آن‌ها پس از ارزیابی، آموزش و تأیید صلاحیت وارد ناوگان می‌شوند تا کیفیت خدمات در همه سفرها حفظ شود."
        items={trainedDriverItems}
        buttonText="مشاهده شرایط همکاری"
        buttonHref="/join-us/drivers"
      />
      <FleetFeature
        imageSide="right"
        image={securiyImage}
        imageAlt="امنیت کامل و فناوری هوشمند"
        title="رانندگان آموزش‌دیده"
        description="زیرساخت نرم‌افزاری دات‌وان تمام مراحل سفر را از درخواست تا پایان مسیر به‌صورت هوشمند مدیریت می‌کند تا تجربه‌ای سریع، شفاف و قابل اعتماد برای مسافر و راننده ایجاد شود."
        items={securiyItems}
      />
      <TripStartHero
        image={tripStartImage}
        imageAlt="شروع سفر با دات‌وان تریپ"
        eyebrow="تجربه سفر با دات‌وان"
        title="سفر، از لحظه درخواست شروع می‌شود"
        description="دات‌وان تریپ تلاش می‌کند تمام مسیر سفر، از درخواست تا رسیدن به مقصد، ساده، شفاف و قابل اعتماد باشد."
      />
      <IranCoverage
        title="دات‌وان تریپ در سراسر ایران"
        subtitle="آمار ثبت‌نام راننده‌ها در استان‌های کشور"
        mapImage={iranMap}
        mapAlt="نقشه ایران"
        items={coverageItems}
        description={
          <>
            <strong>دات‌وان تریپ با توسعه ناوگان و زیرساخت حمل‌ونقل،</strong>{" "}
            خدمات خود را به‌صورت مرحله‌ای
            <br />
            در <strong>استان‌های مختلف ایران</strong> ارائه می‌دهد.
          </>
        }
      />
      <TravelSolutions
        badge="همه‌جا دات‌وان تریپ"
        title="هر سفر، یک راه‌حل متناسب"
        description="دات‌وان تریپ، مجموعه‌ای از خدمات حمل‌ونقل را برای نیازهای مختلف مسافران، سازمان‌ها و مجموعه‌ها ارائه می‌دهد."
        cards={solutionCards}
      />
      <div className="md:mt-20">
        <JoinBanner
          eyebrow="به دات‌وان تریپ بپیوندید"
          title="دات‌وان تریپ فقط یک سفر نیست؛"
          highlightedText="یک فرصت برای ساختن آینده است."
          description="اگر می‌خواهید بخشی از مسیر جدید حمل‌ونقل باشید، دات‌وان تریپ مسیرهای مختلفی برای همکاری در اختیار شما قرار می‌دهد."
          image={driversImage}
          imageAlt="رانندگان دات‌وان تریپ"
          primaryAction={{
            text: "مشارکت در دات‌وان تریپ",
            href: "https://apply.dotone.ir/",
          }}
          secondaryAction={{
            text: "فرصت‌های استخدام",
            href: "/join-us",
          }}
        />
      </div>
      <VehicleShowcase
        title="ناوگان دات‌وان تریپ را بشناسید"
        badgeText="درباره دات‌وان تریپ"
        vehicles={[
          {
            id: "byd-seal-about",

            image: {
              src: carSideView,
              alt: "BYD Seal",
            },

            sideDescription:
              "در دات‌وان تریپ، خودرو فقط وسیله‌ای برای رسیدن به مقصد نیست؛ بخشی از تجربه سفر است. ناوگان دات‌وان تریپ با تمرکز بر ایمنی، راحتی و فناوری انتخاب شده تا کیفیت سفر از لحظه ورود تا رسیدن به مقصد حفظ شود.",

            footerText: "بی‌وای‌دی سیل ۵ دی‌ام-آی هیبریدی",
          },
          {
            id: "byd-seal-about2",

            image: {
              src: carSideView,
              alt: "BYD Seal",
            },

            sideDescription:
              "در دات‌وان تریپ، خودرو فقط وسیله‌ای برای رسیدن به مقصد نیست؛ بخشی از تجربه سفر است. ناوگان دات‌وان تریپ با تمرکز بر ایمنی، راحتی و فناوری انتخاب شده تا کیفیت سفر از لحظه ورود تا رسیدن به مقصد حفظ شود.",

            footerText: "بی‌وای‌دی سیل ۵ دی‌ام-آی هیبریدی",
          },
          {
            id: "byd-seal-about3",

            image: {
              src: carSideView,
              alt: "BYD Seal",
            },

            sideDescription:
              "در دات‌وان تریپ، خودرو فقط وسیله‌ای برای رسیدن به مقصد نیست؛ بخشی از تجربه سفر است. ناوگان دات‌وان تریپ با تمرکز بر ایمنی، راحتی و فناوری انتخاب شده تا کیفیت سفر از لحظه ورود تا رسیدن به مقصد حفظ شود.",

            footerText: "بی‌وای‌دی سیل ۵ دی‌ام-آی هیبریدی",
          },
        ]}
      />

      <div className="md:mt-50">
        <DownloadBanner />
      </div>

      <NewsSection
        eyebrow="اخبار و رویدادها"
        title="دات‌وان تریپ در مسیر توسعه"
        description="آخرین اخبار، رویدادها و اتفاقات دات‌وان تریپ را دنبال کنید."
        featuredNews={featuredNews}
        news={newsData}
        allNewsHref="/news"
        allNewsLabel="مشاهده همه اخبار"
      />
      <FAQ
        subtitle="آشنایی با دات‌وان تریپ"
        title="سؤالات متداول"
        description="پاسخ سوالاتی که ممکن است قبل از استفاده از خدمات دات‌وان تریپ برای شما ایجاد شود."
        items={tripFaqItems}
      />
      <FutureTransportBanner />
      <Footer />
    </main>
  );
}
