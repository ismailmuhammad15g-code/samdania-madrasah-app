import {
  adminDeniedResponse,
  adminPreflight,
  apiResponse,
  getSupabaseConfig,
  hasAdminAccess,
  serviceUnavailable,
  supabaseAdminFetch,
} from "@/lib/supabase-server";
import type { SiteContent } from "@/lib/school-data";

const CONTENT_KEYS = ["academic_en", "academic_bn", "admission_en", "admission_bn"] as const;

export function OPTIONS() {
  return adminPreflight();
}

export async function GET(request: Request) {
  if (!(await hasAdminAccess(request))) return adminDeniedResponse();
  if (!getSupabaseConfig()) return serviceUnavailable("Supabase server configuration is missing.");

  try {
    const response = await supabaseAdminFetch(request,
      "/rest/v1/main_madrasah_content?select=content_key,content_value",
    );
    if (!response.ok) {
      console.error("Admin content query failed with status", response.status);
      return apiResponse({ message: "Website content could not be loaded." }, 502, true);
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
          CONTENT_KEYS.includes(row.content_key as (typeof CONTENT_KEYS)[number])
        ) {
          content[row.content_key] = row.content_value;
        }
      }
    }

    return apiResponse({ content }, 200, true);
  } catch (error) {
    console.error("Admin content request failed.", error);
    return apiResponse({ message: "Website content could not be loaded." }, 502, true);
  }
}

export async function PUT(request: Request) {
  if (!(await hasAdminAccess(request))) return adminDeniedResponse();
  if (!getSupabaseConfig()) return serviceUnavailable("Supabase server configuration is missing.");

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return apiResponse({ message: "The content update was not valid JSON." }, 400, true);
  }

  if (!input || typeof input !== "object" || !("content" in input)) {
    return apiResponse({ message: "Website content is required." }, 400, true);
  }

  const content = (input as { content: unknown }).content;
  if (!content || typeof content !== "object") {
    return apiResponse({ message: "Website content must be an object." }, 400, true);
  }

  const rows: Array<{ content_key: string; content_value: string }> = [];
  for (const key of CONTENT_KEYS) {
    const value = (content as Partial<SiteContent>)[key];
    if (typeof value !== "string" || value.length > 4000) {
      return apiResponse({ message: "Each content field must be text under 4,000 characters." }, 400, true);
    }
    rows.push({ content_key: key, content_value: value.trim() });
  }

  try {
    const response = await supabaseAdminFetch(request,
      "/rest/v1/main_madrasah_content?on_conflict=content_key",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(rows),
      },
    );

    if (!response.ok) {
      console.error("Admin content save failed with status", response.status);
      return apiResponse({ message: "Website content could not be saved." }, 502, true);
    }

    return apiResponse({ message: "Website content saved." }, 200, true);
  } catch (error) {
    console.error("Admin content save failed.", error);
    return apiResponse({ message: "Website content could not be saved." }, 502, true);
  }
}
