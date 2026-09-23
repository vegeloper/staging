import Footer from "@/components/ui/footer/Footer";
import Header from "@/components/ui/Header/Header";
import Positions from "@/components/ui/positions/Positions";
import { getPublicPositions } from "@/lib/jobs/service";

export const dynamic = "force-dynamic";

export default async function page() {
  const jobs = await getPublicPositions();

  return (
    <>
      <Header />
      <div className="mt-20">
        <Positions
          type="corporate"
          title="موقعیت‌های شغلی سازمانی"
          subtitle="فرصت‌های شغلی دات‌وان تریپ را بررسی کنید"
          jobs={jobs}
          itemsPerPage={5}
        />
      </div>
      <Footer />
    </>
  );
}
