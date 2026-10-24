import type { Metadata } from "next";
import SchoolSite from "@/components/school-site";

export const metadata: Metadata = {
  title: "About our teachers | Samdania Talimul Islam Madrasah",
  description: "Teacher biographies and profiles for Samdania Talimul Islam Madrasah.",
};

export default function AboutPage() {
  return <SchoolSite />;
}
