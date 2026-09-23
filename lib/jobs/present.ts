import type { CorporateJobCardProps } from "@/components/ui/join-us/CorporateJobCard/CorporateJobCard";
import type { JobDetailsProps } from "@/components/ui/join-us/JobDetails/JobDetails";

import type { JobMetaItem, JobSection } from "./types";

export type PresentablePosition = {
  slug: string;
  title: string;
  employmentType: string;
  department: string;
  city: string;
  summary: string;
  highlights: string[];
  sections: JobSection[];
  meta: JobMetaItem[];
};

export function toCorporateCard(position: PresentablePosition): CorporateJobCardProps {
  return {
    id: position.slug,
    title: position.title,
    employmentType: position.employmentType,
    locations: [
      { label: position.department, icon: "/figma/svgs/building.svg" },
      { label: position.city, icon: "/figma/svgs/location.svg" },
    ],
  };
}

export function toJobDetails(position: PresentablePosition): JobDetailsProps {
  const sections =
    position.sections.length > 0
      ? position.sections
      : [{ title: "شرح موقعیت", description: position.summary }];
  const meta =
    position.meta.length > 0
      ? position.meta
      : [
          { label: "نوع همکاری", value: position.employmentType },
          { label: "شهر", value: position.city },
        ];
  return {
    title: position.title,
    highlights: position.highlights,
    sections,
    meta,
  };
}
