import Header from "@/components/ui/Header/Header";
import { CooperationCard } from "@/components/ui/join-us/CooperationCardItem/CooperationCardItem";
import CooperationSection from "@/components/ui/join-us/CooperationSection/CooperationSection";
import careerHeroImage from "@/public/figma/careerHeroImage.png";
import driverImage from "@/public/figma/femailDrivers.png";
import partnershipImage from "@/public/figma/partenrShip.png";
import careerImage from "@/public/figma/parkedCars.png";
import CareerHero from "@/components/ui/join-us/CareerHero/CareerHero";
import CorporateJobCard, {
  CorporateJobCardProps,
} from "@/components/ui/join-us/CorporateJobCard/CorporateJobCard";
import DriverHiringCard, {
  DriverHiringCardProps,
} from "@/components/ui/join-us/DriverHiringCard/DriverHiringCard";
import DriverHiringSection from "@/components/ui/join-us/DriverHiringSection/DriverHiringSection";
import CorporateJobsSection from "@/components/ui/join-us/CorporateJobsSection/CorporateJobsSection";
import PartnershipSection from "@/components/ui/join-us/PartnershipSection/PartnershipSection";
import partnershipCarImage from "@/public/figma/driver-Highway.png";
import Footer from "@/components/ui/footer/Footer";
import FAQ, { FAQItem } from "@/components/ui/Faq/Faq";
const cooperationCards: CooperationCard[] = [
  {
    title: "همکاری به عنوان راننده",
    description:
      "با پیوستن به شبکه رانندگان، در شهرهای فعال با ما همکاری کنید. اگر هنوز در شهر شما فعالیت خود را آغاز نکرده‌ایم، می‌توانید برای همکاری در آینده پیش‌ثبت‌نام کنید.",
    buttonText: "همکاری به عنوان راننده",
    image: driverImage,
    imageAlt: "همکاری به عنوان راننده",
    position: "bottom",
    href:"/join-us/drivers"

  },

  {
    title: "فرصت‌های شغلی سازمانی",
    description:
      "دات‌وان تریپ برای توسعه تیم خود، فرصت‌های شغلی سازمانی متنوعی فراهم کرده است. موقعیت‌های فعال را بررسی کنید و مسیر همکاری خود را آغاز کنید.",
    buttonText: "مشاهده فرصت‌های شغلی",
    image: careerImage,
    imageAlt: "فرصت‌های شغلی",
    position: "top",
    href:"/join-us/organizational"

  },
  {
    title: "همکاری به‌صورت مشارکتی",
    description:
      "با سرمایه‌گذاری روی توسعه ناوگان و بهره‌برداری از آن در شبکه ما، از طریق مدل مشارکتی با ما همکاری کنید.",
    buttonText: "همکاری به‌صورت مشارکتی",
    image: partnershipImage,
    imageAlt: "همکاری به صورت مشارکتی",
    position: "bottom",
    href:""
  },
];
export const driverJobs: DriverHiringCardProps[] = [
  {
    id: "1",
    city: "مشهد",
    driverCount: 20,
    title: "فراخوان استخدام",
    description:
      "دات‌وان تریپ برای استان مشهد به تعداد ۲۰ نفر فراخوان استخدام راننده دارد.",
  },
  {
    id: "2",

    city: "مشهد",
    driverCount: 20,
    title: "فراخوان استخدام",
    description:
      "دات‌وان تریپ برای استان مشهد به تعداد ۲۰ نفر فراخوان استخدام راننده دارد.",
  },
  {
    id: "3",

    city: "مشهد",
    driverCount: 20,
    title: "فراخوان استخدام",
    description:
      "دات‌وان تریپ برای استان مشهد به تعداد ۲۰ نفر فراخوان استخدام راننده دارد.",
  },
  {
    id: "4",

    city: "مشهد",
    driverCount: 20,
    title: "فراخوان استخدام",
    description:
      "دات‌وان تریپ برای استان مشهد به تعداد ۲۰ نفر فراخوان استخدام راننده دارد.",
  },
];

export const corporateJobs: CorporateJobCardProps[] = [
  {
    id: "test",
    title: "نوع پوزیشن کاری",

    employmentType: "تمام وقت",

    locations: [
      {
        label: "تبریز",
        icon: "/figma/svgs/building.svg",
      },
      {
        label: "تهران",
        icon: "/figma/svgs/location.svg",
      },
    ],
  },

  {
    id: "test2",
    title: "نوع پوزیشن کاری",

    employmentType: "تمام وقت",

    locations: [
      {
        label: "تبریز",
        icon: "/figma/svgs/building.svg",
      },
      {
        label: "تهران",
        icon: "/figma/svgs/location.svg",
      },
    ],
  },

  {
    id: "test3",

    title: "نوع پوزیشن کاری",

    employmentType: "تمام وقت",

    locations: [
      {
        label: "تبریز",
        icon: "/figma/svgs/building.svg",
      },
      {
        label: "تهران",
        icon: "/figma/svgs/location.svg",
      },
    ],
  },

  {
    id: "test4",

    title: "نوع پوزیشن کاری",

    employmentType: "تمام وقت",

    locations: [
      {
        label: "تبریز",
        icon: "/figma/svgs/building.svg",
      },
      {
        label: "تهران",
        icon: "/figma/svgs/location.svg",
      },
    ],
  },
];

export const tripFaqItems: FAQItem[] = [
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
export default function page() {
  return (
    <>
      <Header />
      <CareerHero
        badge="فرصت‌های همکاری"
        highlightedText="مسیر همکاری"
        title="خود را انتخاب کنید"
        description="چه قصد داشته باشید به‌عنوان راننده با ناوگان تریپ همکاری کنید، چه از طریق فرصت‌های شغلی وارد مجموعه شوید، با تیم حرفه‌ای ما همراه شوید و مسیر مناسب همکاری را انتخاب کنید."
        image={careerHeroImage}
        imageAlt="همکاری با دات‌وان تریپ"
      />
      <CooperationSection
        title="سه مسیر برای همکاری با ما"
        subtitle="متناسب با هدف و شرایط خود، مسیر همکاری مناسب را انتخاب کنید."
        cards={cooperationCards}
      />

      <DriverHiringSection
        title="به عنوان راننده با ما همکاری کنید"
        subtitle="فرصت‌های همکاری رانندگان در شهرهای مختلف را ببینید و بر اساس وضعیت شهر خود، برای استخدام یا پیش‌ثبت‌نام اقدام کنید."
        jobs={driverJobs}
        showAllText="مشاهده همه"
        showAllHref="/join-us/drivers"
      />
      <PartnershipSection
        title="با ما به‌صورت مشارکتی همکاری کنید"
        description="با سرمایه‌گذاری روی خودروهای مدرن و به‌روز ناوگان دات‌وان تریپ، وارد مدل همکاری مشارکتی شوید."
        image={partnershipCarImage}
        imageAlt="خودروی ناوگان دات‌وان تریپ"
        buttonText="مشاهده فرصت‌های شغلی"
        buttonHref="https://apply.dotone.ir/"
      />
      <CorporateJobsSection
        title="فرصت‌های شغلی سازمانی"
        subtitle="اگر به‌دنبال یک فرصت شغلی در تیم‌های سازمانی هستید، موقعیت‌های باز را ببینید و برای جایگاه مناسب خود درخواست دهید."
        jobs={corporateJobs}
        showAllText="مشاهده فرصت‌های شغلی"
        showAllHref="/join-us/organizational"
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
