import { ACADEMIC_LEVELS } from "@/lib/school-data";
import { apiResponse, getSupabaseConfig, supabaseFetch } from "@/lib/supabase-server";

const cleanText = (value: unknown, maximum: number): string | null => {
  if (typeof value !== "string") return null;
  const clean = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  return clean.length <= maximum ? clean : null;
};

export async function POST(request: Request) {
  if (!getSupabaseConfig()) {
    return apiResponse({
      message: "Admissions are not connected yet. Configure the Supabase project URL and anon key on the website server.",
    }, 503);
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return apiResponse({ message: "The request was not valid JSON." }, 400);
  }

  if (!input || typeof input !== "object") {
    return apiResponse({ message: "Complete the required admission request fields." }, 400);
  }

  const fields = input as Record<string, unknown>;
  const studentName = cleanText(fields.studentName, 120);
  const studentAge = fields.studentAge;
  const guardianName = cleanText(fields.guardianName, 120);
  const contact = cleanText(fields.contact, 40);
  const className = cleanText(fields.className, 40);
  const message = cleanText(fields.message ?? "", 1000);
  const honeypot = cleanText(fields.website ?? "", 200);

  if (honeypot) {
    return apiResponse({ message: "The admission request could not be accepted." }, 400);
  }

  if (
    !studentName ||
    typeof studentAge !== "number" ||
    !Number.isInteger(studentAge) ||
    studentAge < 5 ||
    studentAge > 10 ||
    !guardianName ||
    !contact ||
    !className ||
    message === null ||
    fields.consent !== true ||
    !ACADEMIC_LEVELS.includes(className as (typeof ACADEMIC_LEVELS)[number])
  ) {
    return apiResponse({ message: "Complete all required fields with valid information." }, 400);
  }

  try {
    const response = await supabaseFetch("/rest/v1/admission_requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        student_name: studentName,
        student_age: studentAge,
        guardian_name: guardianName,
        contact,
        class_name: className,
        message,
        consent_accepted: true,
      }),
    });

    if (!response.ok) {
      console.error("Admission request insert failed with status", response.status);
      return apiResponse({ message: "The admission request could not be saved. Please try again." }, 502);
    }

    return apiResponse({ message: "Admission request received." }, 201);
  } catch (error) {
    console.error("Admission request insert failed.", error);
    return apiResponse({ message: "The admission request could not be saved. Please try again." }, 502);
  }
}
