import { apiResponse, getSupabaseConfig, supabaseFetch } from "@/lib/supabase-server";
import { connection } from "next/server";

const ALLOWED_KEYS = ["academic_en", "academic_bn", "admission_en", "admission_bn"] as const;

export async function GET() {
  await connection();
  if (!getSupabaseConfig()) {
    return apiResponse({ message: "Public website content is not configured." }, 503);
  }

  try {
    const response = await supabaseFetch(
      "/rest/v1/main_madrasah_content?select=content_key,content_value",
    );
    if (!response.ok) {
      console.error("Public content query failed with status", response.status);
      return apiResponse({ message: "Public website content could not be loaded." }, 502);
    }

    const rows: unknown = await response.json();
    const content: Record<string, string> = {};
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (
          row &&
          typeof row === "object" &&
          "content_key" in row &&
          "content_value" in row &&
          typeof row.content_key === "string" &&
          typeof row.content_value === "string" &&
          ALLOWED_KEYS.includes(row.content_key as (typeof ALLOWED_KEYS)[number])
        ) {
          content[row.content_key] = row.content_value;
        }
      }
    }

    return apiResponse({ content });
  } catch (error) {
    console.error("Public content request failed.", error);
    return apiResponse({ message: "Public website content could not be loaded." }, 502);
  }
}
