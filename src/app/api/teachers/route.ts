import { apiResponse, getSupabaseConfig, supabaseFetch } from "@/lib/supabase-server";
import { connection } from "next/server";

export async function GET() {
  await connection();
  if (!getSupabaseConfig()) {
    return apiResponse({ message: "Teacher profiles are not configured yet." }, 503);
  }

  try {
    const response = await supabaseFetch(
      "/rest/v1/teacher_profiles?select=id,name_en,name_bn,role_en,role_bn,qualification_en,qualification_bn,subjects_en,subjects_bn,bio_en,bio_bn,photo_url,sort_order&is_published=eq.true&order=sort_order.asc,name_en.asc&limit=300",
    );
    if (!response.ok) {
      console.error("Public teacher list failed with status", response.status);
      return apiResponse({ message: "Teacher profiles could not be loaded." }, 502);
    }

    return apiResponse({ teachers: await response.json() });
  } catch (error) {
    console.error("Public teacher list request failed.", error);
    return apiResponse({ message: "Teacher profiles could not be loaded." }, 502);
  }
}
