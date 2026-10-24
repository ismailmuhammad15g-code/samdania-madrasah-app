import {
  adminDeniedResponse,
  adminPreflight,
  apiResponse,
  getSupabaseConfig,
  hasAdminAccess,
  serviceUnavailable,
  supabaseAdminFetch,
} from "@/lib/supabase-server";

const STATUSES = ["new", "reviewed", "contacted", "closed"] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function OPTIONS() {
  return adminPreflight();
}

export async function GET(request: Request) {
  if (!(await hasAdminAccess(request))) return adminDeniedResponse();
  if (!getSupabaseConfig()) return serviceUnavailable("Supabase server configuration is missing.");

  try {
    const response = await supabaseAdminFetch(request,
      "/rest/v1/admission_requests?select=id,student_name,student_age,guardian_name,contact,class_name,message,status,created_at&order=created_at.desc&limit=100",
    );
    if (!response.ok) {
      console.error("Admission request list failed with status", response.status);
      return apiResponse({ message: "Admission requests could not be loaded." }, 502, true);
    }

    const admissions: unknown = await response.json();
    return apiResponse({ admissions }, 200, true);
  } catch (error) {
    console.error("Admission request list failed.", error);
    return apiResponse({ message: "Admission requests could not be loaded." }, 502, true);
  }
}

export async function PATCH(request: Request) {
  if (!(await hasAdminAccess(request))) return adminDeniedResponse();
  if (!getSupabaseConfig()) return serviceUnavailable("Supabase server configuration is missing.");

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return apiResponse({ message: "The admission update was not valid JSON." }, 400, true);
  }

  if (!input || typeof input !== "object" || !("id" in input) || !("status" in input)) {
    return apiResponse({ message: "An admission request ID and status are required." }, 400, true);
  }

  const { id, status } = input as { id: unknown; status: unknown };
  if (
    typeof id !== "string" ||
    !UUID_PATTERN.test(id) ||
    typeof status !== "string" ||
    !STATUSES.includes(status as (typeof STATUSES)[number])
  ) {
    return apiResponse({ message: "The admission request update is invalid." }, 400, true);
  }

  try {
    const response = await supabaseAdminFetch(request,
      `/rest/v1/admission_requests?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ status }),
      },
    );
    if (!response.ok) {
      console.error("Admission request update failed with status", response.status);
      return apiResponse({ message: "The admission request could not be updated." }, 502, true);
    }

    return apiResponse({ message: "Admission request updated." }, 200, true);
  } catch (error) {
    console.error("Admission request update failed.", error);
    return apiResponse({ message: "The admission request could not be updated." }, 502, true);
  }
}

export async function DELETE(request: Request) {
  if (!(await hasAdminAccess(request))) return adminDeniedResponse();
  if (!getSupabaseConfig()) return serviceUnavailable("Supabase server configuration is missing.");

  let id: unknown;
  try {
    const body: unknown = await request.json();
    id = body && typeof body === "object" && "id" in body
      ? (body as { id: unknown }).id
      : null;
  } catch {
    return apiResponse({ message: "The admission request deletion was not valid JSON." }, 400, true);
  }

  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    return apiResponse({ message: "The admission request ID is invalid." }, 400, true);
  }

  try {
    const response = await supabaseAdminFetch(request,
      `/rest/v1/admission_requests?id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      console.error("Admission request delete failed with status", response.status);
      return apiResponse({ message: "The admission request could not be deleted." }, 502, true);
    }

    return apiResponse({ message: "Admission request deleted." }, 200, true);
  } catch (error) {
    console.error("Admission request delete failed.", error);
    return apiResponse({ message: "Admission request could not be deleted." }, 502, true);
  }
}
