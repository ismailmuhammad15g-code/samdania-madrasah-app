export const SCHOOL_NAME = "Samdania Talimul Islam Madrasah";
export const SCHOOL_NAME_BN = "সামদানিয়া তালিমুল ইসলাম মাদ্রাসা";

export const ACADEMIC_LEVELS = [
  "Play",
  "Nursery",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Nazera",
  "Hifz",
] as const;

export const ACADEMIC_PROGRAMS = [
  {
    name_en: "Play & Nursery (Shishu)",
    name_bn: "প্লে ও নার্সারি (শিশু)",
    description_en: "Uses study sheets prepared by the madrasah.",
    description_bn: "মাদ্রাসার নিজস্ব প্রস্তুতকৃত শিট অনুসরণ করা হয়।",
  },
  {
    name_en: "Classes 1–5 (Ibtedayi)",
    name_bn: "১ম–৫ম শ্রেণি (ইবতেদায়ি)",
    description_en: "Non-residential. Follows official Government Primary textbooks.",
    description_bn: "অনাবাসিক। সরকারি প্রাথমিক পাঠ্যপুস্তক অনুসরণ করা হয়।",
  },
  {
    name_en: "Nazera",
    name_bn: "নাজেরা",
    description_en: "Residential program.",
    description_bn: "আবাসিক বিভাগ।",
  },
  {
    name_en: "Hifz",
    name_bn: "হিফজ",
    description_en: "Residential program.",
    description_bn: "আবাসিক বিভাগ।",
  },
] as const;

export const ACADEMIC_SUBJECTS = [
  { en: "Bengali", bn: "বাংলা" },
  { en: "English", bn: "ইংরেজি" },
  { en: "Mathematics", bn: "গণিত" },
  { en: "Arabic", bn: "আরবি" },
  { en: "Quran", bn: "কুরআন" },
  { en: "Hadith", bn: "হাদিস" },
  { en: "Aqeedah", bn: "আকাইদ" },
  { en: "Fiqh", bn: "ফিকাহ" },
] as const;

export const SCHOOL_CONTACT = {
  address_en: "Pir Badrul Islam Samdani Complex, Khankaye Furfora Sharif, Ward No. 2, Galachipa, Patuakhali.",
  address_bn: "পীর বদরুল ইসলাম সামদানী কমপ্লেক্স, খানকায়ে ফুরফুরা শরীফ, ২ নং ওয়ার্ড, গলাচিপা, পটুয়াখালী।",
  phone: "01792776433",
  email: "samdaniamadrasha@gmail.com",
} as const;

export const SOCIAL_LINKS = [
  { label: "YouTube", href: "https://www.youtube.com/@ROSHIKTV01" },
  {
    label: "Facebook",
    href: "https://www.facebook.com/people/Samdania-Main-Madrasha/61553058695833/",
  },
] as const;

export const LOCAL_GALLERY_IMAGES = [
  "/gallery/img1.webp",
  "/gallery/img2.webp",
  "/gallery/img3.webp",
  "/gallery/img4.webp",
  "/gallery/img5.webp",
  "/gallery/img6.webp",
  "/gallery/img7.webp",
  "/gallery/img8.webp",
] as const;

export type SiteContent = {
  academic_en: string;
  academic_bn: string;
  admission_en: string;
  admission_bn: string;
};

export type TeacherProfile = {
  id: string;
  name_en: string;
  name_bn: string;
  role_en: string;
  role_bn: string;
  qualification_en: string;
  qualification_bn: string;
  subjects_en: string;
  subjects_bn: string;
  bio_en: string;
  bio_bn: string;
  photo_url: string;
  sort_order: number;
};

export const EMPTY_SITE_CONTENT: SiteContent = {
  academic_en: "",
  academic_bn: "",
  admission_en: "",
  admission_bn: "",
};
