import Footer from "@/components/ui/footer/Footer";
import Header from "@/components/ui/Header/Header";
import Positions from "@/components/ui/positions/Positions";

import { getCorporateJobCards } from "@/lib/corporateJobs";

export default function CorporateJobsPage() {
  const jobs = getCorporateJobCards();

  return (
    <>
      <Header />

      <main className="mt-12 md:mt-20 lg:mt-40">
        <Positions
          type="corporate"
          title="موقعیت‌های شغلی سازمانی"
          subtitle="فرصت‌های شغلی دات‌وان تریپ را بررسی کنید"
          jobs={jobs}
          itemsPerPage={5}
        />
      </main>

      <Footer />
    </>
  );
}