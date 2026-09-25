import Footer from "@/components/ui/footer/Footer";
import Header from "@/components/ui/Header/Header";
import Positions from "@/components/ui/positions/Positions";

import { getDriverJobCards } from "@/lib/driverJobs";

export default function DriversPage() {
  const jobs = getDriverJobCards();

  return (
    <>
      <Header />

      <main className="mt-12 md:mt-20 lg:mt-40">
        <Positions
          type="driver"
          title="به عنوان راننده با ما همکاری کنید"
          subtitle="فرصت‌های همکاری رانندگان در شهرهای مختلف را ببینید و بر اساس وضعیت شهر خود، برای استخدام یا پیش‌ثبت‌نام اقدام کنید."
          jobs={jobs}
          itemsPerPage={12}
        />
      </main>

      <Footer />
    </>
  );
}