import type { Metadata } from "next";
import SchoolSite from "@/components/school-site";

export const metadata: Metadata = {
  title: "Admission | Samdania Talimul Islam Madrasah",
  description: "Admission eligibility, process, required documents, and online admission request.",
};

export default function AdmissionPage() {
  return <SchoolSite />;
}
