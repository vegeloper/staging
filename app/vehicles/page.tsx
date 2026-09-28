import FeatureSection from "@/components/ui/FeatureSection/FeatureSection";
import FleetShowcase from "@/components/ui/FleetShowcase/FleetShowcase";
import Header from "@/components/ui/Header/Header";
import VehicleFlexibleServices from "@/components/ui/VehicleFlexibleServices/VehicleFlexibleServices";
import VehicleShowcase from "@/components/ui/VehicleShowcase/VehicleShowcase";
import tripQualityImage from "@/public/figma/sea.png";
import exebitionImage from "@/public/figma/exebition.png";
import DownloadBanner from "@/components/ui/DownloadBanner/DownloadBanner";
import FAQ, { FAQItem } from "@/components/ui/Faq/Faq";
import FutureTransportBanner from "@/components/ui/FutureTransportBanner/FutureTransportBanner";
import Footer from "@/components/ui/footer/Footer";
import carSideView from "@/public/figma/vehicles/Car-SideView.svg";
import carSideView2 from "@/public/figma/carousel2.png";
import carSideView3 from "@/public/figma/carousel3.png";
export const tripFaqItems: FAQItem[] = [
  {
    question: "خودروهای دات‌وان تریپ برای چه نوع سفرهایی قابل استفاده هستند؟ ",
    answer:"در حال حاضر، ناوگان دات‌وان تریپ برای سفرهای درون‌شهری طراحی شده است."  },
  {
    question: "خودرو در اختیار برای چند ساعت قابل درخواست است؟",
    answer: "سرویس در اختیار را می‌توانید متناسب با نیاز خود، تا سقف ۸ ساعت درخواست کنید.",
  },
  {
    question: "چه نوع خودروهایی در ناوگان دات‌وان تریپ وجود دارد؟ ",
    answer:"ناوگان دات‌وان تریپ شامل خودروهای BYD، Toyota BZ3 و Changan با مدل‌های برقی و هیبریدی است."
  },
  {
    question: "آیا خودروهای ناوگان دات‌وان تریپ برقی هستند؟  ",
    answer:"ناوگان دات‌وان تریپ شامل خودروهای برقی و هیبریدی نسل جدید است. توسعه ناوگان پاک و استفاده از خودروهای کم‌مصرف و سازگارتر با محیط‌زیست، یکی از محورهای اصلی توسعه مجموعه است."
  },
  {
    question: "ظرفیت خودروهای دات‌وان تریپ چند نفر است؟  ",
    answer:"خودروهای سواری ناوگان دات‌وان تریپ ظرفیت جابه‌جایی حداکثر ۴ مسافر را دارند."
  },
];
export default function page() {
  return (
    <>
      <Header />
      <div className="mt-16 md:mt-20 lg:mt-24">
        <FleetShowcase />
      </div>
      <VehicleFlexibleServices />
<VehicleShowcase
  title="خودروی موردنظر خود را دقیق‌تر بشناسید"
  description="در هر مدل، اطلاعاتی را که برای انتخاب خودرو اهمیت دارد بررسی کنید."
  vehicles={[
    {
      id: "byd-seal",

      name: "بی‌وای‌دی سیل ۵ دی‌ام-آی هیبریدی",

      image: {
        src: carSideView,
        alt: "BYD Seal",
      },

      specs: [
        {
          label: "نوع خودرو",
          value: "سواری",
        },
        {
          label: "ظرفیت",
          value: "۴ مسافر",
        },
        {
          label: "نوع کاربری",
          value: "شهری",
        },
      ],

      detailsHref: "/vehicles/byd-seal",
      detailsLabel: "مشاهده جزییات",
    },

    {
      id: "byd-",

      name: "تویوتا BZ3X سفید بنزینی",

      image: {
        src: carSideView2,
        alt: "BYD Seal",
      },

      specs: [
        {
          label: "نوع خودرو",
          value: "سواری",
        },
        {
          label: "ظرفیت",
          value: "۴ مسافر",
        },
        {
          label: "نوع کاربری",
          value: "شهری",
        },
      ],

      detailsHref: "/vehicles/byd-seal",
      detailsLabel: "مشاهده جزییات",
    },

    {
      id: "byd-seal3",

      name: "چانگان ایدو EV460 برقی",

      image: {
        src: carSideView3,
        alt: "BYD Seal",
      },

      specs: [
        {
          label: "نوع خودرو",
          value: "سواری",
        },
        {
          label: "ظرفیت",
          value: "۴ مسافر",
        },
        {
          label: "نوع کاربری",
          value: "شهری",
        },
      ],

      detailsHref: "/vehicles/byd-seal",
      detailsLabel: "مشاهده جزییات",
    },
  ]}
/>
      <FeatureSection
        imageSide="right"
        title="ناوگان، بخشی از کیفیت سفر است"
        description="کیفیت یک سرویس حمل‌ونقل فقط به مسیر و راننده محدود نمی‌شود. خودرو نیز نقش مهمی در تجربه سفر دارد. به همین دلیل، وضعیت خودروها و الزامات مربوط به ارائه سرویس باید در طول فعالیت ناوگان مورد توجه قرار گیرد."
        image={{
          src: tripQualityImage,
          alt: "راننده دات‌وان تریپ",
          width: 720,
          height: 480,
        }}
        featTitle="چهار محور"
        features={[
          {
            title: "ایمنی",
            description: "توجه به الزامات و استانداردهای ایمنی خودرو.",
          },
          {
            title: "آمادگی خودرو",
            description: "بررسی وضعیت خودرو پیش از ارائه سرویس.",
          },
          {
            title: "نظافت و شرایط ظاهری",
            description: "حفظ شرایط مناسب خودرو برای استفاده مسافران.",
          },
          {
            title: "نگهداری",
            description: "رسیدگی و نگهداری منظم برای حفظ آمادگی خودرو.",
          },
        ]}
      />
      <FeatureSection
        imageSide="left"
        title="حرکت به سمت نسل جدید حمل‌ونقل"
        description="دات‌وان تریپ با استفاده از خودروهای مجهز به فناوری‌های جدید و توسعه ناوگان برقی و هیبریدی، به دنبال ارائه تجربه‌ای مدرن‌تر از سفر است."
        image={{
          src: exebitionImage,
          alt: "راننده دات‌وان تریپ",
          width: 720,
          height: 480,
        }}
        features={[
          {
            title: "فناوری جدید",
            description:
              "استفاده از فناوری‌های به‌روز در بخشی از ناوگان برای تجربه‌ای مدرن‌تر.",
          },
          {
            title: "خودروهای برقی و هیبریدی",
            description:
              "حرکت به سمت استفاده بیشتر از راهکارهای حمل‌ونقل برقی و کم‌مصرف.",
          },
          {
            title: "نگاه رو به آینده",
            description:
              "توسعه ناوگان هم‌راستا با تغییرات صنعت حمل‌ونقل و نیازهای جدید کاربران.",
          },
        ]}
      />
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
