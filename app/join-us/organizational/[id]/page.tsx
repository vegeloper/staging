import type { Metadata } from "next";

import { notFound } from "next/navigation";

import CareerForm from "@/components/forms/CareerForm";

import Footer from "@/components/ui/footer/Footer";
import Header from "@/components/ui/Header/Header";

import JobDetails from "@/components/ui/join-us/JobDetails/JobDetails";

import { getPublishedPosition } from "@/lib/jobs/service";

type CorporateJobPageProps = {
  params: Promise<{
    id: string;
  }>;
};


/* ========================================
   Static Params
======================================== */

export const dynamic = "force-dynamic";

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
      job.sections.find(
        (section) => section.description,
      )?.description ??
      `مشاهده جزئیات موقعیت شغلی ${job.title} در دات‌وان تریپ`,
  };
}


/* ========================================
   Page
======================================== */

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
          <JobDetails
            title={job.title}
            highlights={job.highlights}
            sections={job.sections}
            meta={job.meta}
          />
        </div>

        <CareerForm />
      </main>

      <Footer />
    </>
  );
}