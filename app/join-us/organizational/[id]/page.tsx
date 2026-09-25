import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CareerForm from "@/components/forms/CareerForm";

import Footer from "@/components/ui/footer/Footer";
import Header from "@/components/ui/Header/Header";
import JobDetails from "@/components/ui/join-us/JobDetails/JobDetails";
import { getPublishedPosition } from "@/lib/jobs/service";

export const dynamic = "force-dynamic";

type CorporateJobPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: CorporateJobPageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublishedPosition(id);

  if (!job) {
    return {
      title: "موقعیت شغلی | دات‌وان تریپ",
    };
  }

  return {
    title: `${job.title} | دات‌وان تریپ`,
    description:
      job.sections.find((section) => section.description)?.description ??
      `مشاهده جزئیات موقعیت شغلی ${job.title} در دات‌وان تریپ`,
  };
}

export default async function CorporateJobPage({
  params,
}: CorporateJobPageProps) {
  const { id } = await params;
  const job = await getPublishedPosition(id);

  if (!job) {
    notFound();
  }

  return (
    <>
      <Header />

      <main>
        <div className="mt-20">
          <JobDetails {...job} />
        </div>

        <CareerForm />
      </main>

      <Footer />
    </>
  );
}
