import { notFound } from "next/navigation";

import CareerForm from "@/components/forms/CareerForm";
import Footer from "@/components/ui/footer/Footer";
import Header from "@/components/ui/Header/Header";
import JobDetails from "@/components/ui/join-us/JobDetails/JobDetails";
import { getPublishedPosition } from "@/lib/jobs/service";

export const dynamic = "force-dynamic";

export default async function page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const details = await getPublishedPosition(id);
  if (!details) notFound();

  return (
    <>
      <Header />
      <div className="mt-20">
        <JobDetails {...details} />
      </div>
      <div>
        <CareerForm />
      </div>
      <Footer />
    </>
  );
}
