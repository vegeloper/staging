import Header from "@/components/ui/Header/Header";

import {
  CooperationCard,
} from "@/components/ui/join-us/CooperationCardItem/CooperationCardItem";

import CooperationSection from "@/components/ui/join-us/CooperationSection/CooperationSection";
import CareerHero from "@/components/ui/join-us/CareerHero/CareerHero";
import DriverHiringSection from "@/components/ui/join-us/DriverHiringSection/DriverHiringSection";
import CorporateJobsSection from "@/components/ui/join-us/CorporateJobsSection/CorporateJobsSection";
import PartnershipSection from "@/components/ui/join-us/PartnershipSection/PartnershipSection";

import Footer from "@/components/ui/footer/Footer";

import FAQ, {
  FAQItem,
} from "@/components/ui/Faq/Faq";

import { getDriverJobCards } from "@/lib/driverJobs";
import { getPublicPositions } from "@/lib/jobs/service";

import careerHeroImage from "@/public/figma/careerHeroImage.png";
import driverImage from "@/public/figma/femailDrivers.png";
import partnershipImage from "@/public/figma/partenrShip.png";
import careerImage from "@/public/figma/parkedCars.png";
import partnershipCarImage from "@/public/figma/driver-Highway.png";

export const dynamic = "force-dynamic";

/* ========================================
   Cooperation Cards
======================================== */
const cooperationCards: CooperationCard[] = [
  {
    title: "همکاری به عنوان راننده",
    description:
      "با پیوستن به شبکه رانندگان، در شهرهای فعال با ما همکاری کنید. اگر هنوز در شهر شما فعالیت خود را آغاز نکرده‌ایم، می‌توانید برای همکاری در آینده پیش‌ثبت‌نام کنید.",
    buttonText: "همکاری به عنوان راننده",
    image: driverImage,
    imageAlt: "همکاری به عنوان راننده",
    position: "bottom",
    href: "/join-us/drivers",
  },

  {
    title: "فرصت‌های شغلی سازمانی",
    description:
      "دات‌وان تریپ برای توسعه تیم خود، فرصت‌های شغلی سازمانی متنوعی فراهم کرده است. موقعیت‌های فعال را بررسی کنید و مسیر همکاری خود را آغاز کنید.",
    buttonText: "مشاهده فرصت‌های شغلی",
    image: careerImage,
    imageAlt: "فرصت‌های شغلی",
    position: "top",
    href: "/join-us/organizational",
  },

  {
    title: "همکاری به‌صورت مشارکتی",
    description:
      "با سرمایه‌گذاری روی توسعه ناوگان و بهره‌برداری از آن در شبکه ما، از طریق مدل مشارکتی با ما همکاری کنید.",
    buttonText: "همکاری به‌صورت مشارکتی",
    image: partnershipImage,
    imageAlt: "همکاری به صورت مشارکتی",
    position: "bottom",
    href: "https://apply.dotone.ir/",
  },
];

/* ========================================
   FAQ
======================================== */

const tripFaqItems: FAQItem[] = [
  {
    question: "فرآیند استخدام راننده چگونه انجام می‌شود؟",
    answer:
      "پس از ثبت درخواست، مدارک و شرایط متقاضی بررسی می‌شود و مراحل ارزیابی، احراز صلاحیت و آموزش انجام خواهد شد. پس از تأیید نهایی، راننده وارد فرآیند همکاری می‌شود.",
  },

  {
    question: "برای استخدام راننده چه مدارکی لازم است؟",
    answer:
      "مدارک هویتی، گواهینامه معتبر و سایر مدارک موردنیاز در فرآیند بررسی اولیه از متقاضی دریافت می‌شود. جزئیات مدارک در زمان شروع فرآیند اعلام خواهد شد.",
  },

  {
    question: "آیا رانندگان پیش از شروع فعالیت آموزش می‌بینند؟",
    answer:
      "بله. رانندگان پیش از شروع فعالیت، آموزش‌های لازم درباره خودرو، اپلیکیشن، فرآیند سفر، الزامات ایمنی و استانداردهای ارائه خدمات را دریافت می‌کنند.",
  },

  {
    question: "چطور می‌توانم برای استخدام راننده اقدام کنم؟",
    answer:
      "برای مشاهده شرایط و شروع فرآیند استخدام، به apply.dotone.ir مراجعه کرده و مراحل ثبت درخواست را دنبال کنید.",
  },
];

/* ========================================
   Page
======================================== */

export default async function Page() {
  const driverJobs = getDriverJobCards().slice(0, 4);
  const corporateJobs = (await getPublicPositions()).slice(0, 4);

  return (
    <>
      <Header />

      <div className="mt-16 md:mt-20 lg:mt-24">
        <CareerHero
          badge="فرصت‌های همکاری"
          highlightedText="مسیر همکاری"
          title="خود را انتخاب کنید"
          description="چه قصد داشته باشید به عنوان راننده با دات وان تریپ همکاری کنید، چه از طریق طرح‌های مشارکتی وارد مجموعه شوید یا به تیم سازمانی بپیوندید، می‌توانید متناسب با شرایط و تخصص خود، مسیر مناسب همکاری را انتخاب کنید."
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
          description={
            <>
              با سرمایه‌گذاری روی{" "}
              <strong>
                خودروهای مدرن و به‌روز ناوگان دات‌وان تریپ
              </strong>
              ، وارد مدل همکاری مشارکتی شوید
            </>
          }
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
      </div>

      <Footer />
    </>
  );
}