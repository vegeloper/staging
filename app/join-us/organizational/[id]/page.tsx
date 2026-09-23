import type { Metadata } from "next";

import { notFound } from "next/navigation";

import CareerForm from "@/components/forms/CareerForm";

import Footer from "@/components/ui/footer/Footer";
import Header from "@/components/ui/Header/Header";

import JobDetails from "@/components/ui/join-us/JobDetails/JobDetails";

import {
  corporateJobs,
  getCorporateJob,
} from "@/lib/corporateJobs";

type CorporateJobPageProps = {
  params: Promise<{
    id: string;
  }>;
};


/* ========================================
   Static Params
======================================== */

export function generateStaticParams() {
  return corporateJobs.map((job) => ({
    id: job.id,
  }));
}


/* ========================================
   Metadata
======================================== */

export async function generateMetadata({
  params,
}: CorporateJobPageProps): Promise<Metadata> {
  const { id } = await params;

  const job = getCorporateJob(id);

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

  const job = getCorporateJob(id);

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