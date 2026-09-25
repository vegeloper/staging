import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DriverForm from "@/components/forms/DriverForm";
import Footer from "@/components/ui/footer/Footer";
import Header from "@/components/ui/Header/Header";

import JobDetails from "@/components/ui/join-us/JobDetails/JobDetails";

import {
  driverJobs,
  getDriverJob,
} from "@/lib/driverJobs";

type DriverJobPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return driverJobs.map((job) => ({
    id: job.id,
  }));
}

export async function generateMetadata({
  params,
}: DriverJobPageProps): Promise<Metadata> {
  const { id } = await params;

  const job = getDriverJob(id);

  if (!job) {
    return {
      title: "استخدام راننده | دات‌وان تریپ",
    };
  }

  return {
    title: `${job.title} | دات‌وان تریپ`,
    description: job.description,
  };
}

export default async function DriverJobPage({
  params,
}: DriverJobPageProps) {
  const { id } = await params;

  const job = getDriverJob(id);

  if (!job) {
    notFound();
  }

  return (
    <>
      <Header />

      <main>
        <div className="mt-20">

          {/* همان JobDetails قبلی */}
          <JobDetails {...job.details} />

        </div>

        <DriverForm />
      </main>

      <Footer />
    </>
  );
}