import { randomUUID } from "node:crypto";
import {
  adminDeniedResponse,
  adminPreflight,
  apiResponse,
  getSupabaseConfig,
  getAccessToken,
  hasAdminAccess,
  serviceUnavailable,
  supabaseFetch,
  supabaseAdminFetch,
} from "@/lib/supabase-server";

const BUCKET = "teacher-profiles";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IMAGE_TYPES = {
  "image/jpeg": { extension: "jpg", signature: (data: Uint8Array) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
  "image/png": { extension: "png", signature: (data: Uint8Array) => data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47 },
  "image/webp": { extension: "webp", signature: (data: Uint8Array) => data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 && data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50 },
} as const;

type TeacherFields = {
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
  sort_order: number;
  is_published: boolean;
};

type TeacherRow = TeacherFields & {
  id: string;
  photo_url: string;
  photo_name: string;
};

function parseFields(form: FormData): TeacherFields | null {
  const text = (key: string, maxLength: number) => {
    const value = form.get(key);
    if (typeof value !== "string") return null;
    const clean = value.trim();
    return clean.length <= maxLength ? clean : null;
  };

  const name_en = text("name_en", 120);
  const name_bn = text("name_bn", 120);
  const role_en = text("role_en", 120);
  const role_bn = text("role_bn", 120);
  const qualification_en = text("qualification_en", 500);
  const qualification_bn = text("qualification_bn", 500);
  const subjects_en = text("subjects_en", 300);
  const subjects_bn = text("subjects_bn", 300);
  const bio_en = text("bio_en", 4000);
  const bio_bn = text("bio_bn", 4000);
  const rawSortOrder = form.get("sort_order");
  const sort_order = typeof rawSortOrder === "string" && rawSortOrder !== ""
    ? Number(rawSortOrder)
    : 0;
  const is_published = form.get("is_published") === "true";

  if (
    !name_en || !name_bn || !role_en || !role_bn ||
    qualification_en === null || qualification_bn === null ||
    subjects_en === null || subjects_bn === null ||
    bio_en === null || bio_bn === null ||
    !Number.isInteger(sort_order) || sort_order < 0 || sort_order > 10000
  ) return null;

  return {
    name_en, name_bn, role_en, role_bn,
    qualification_en, qualification_bn, subjects_en, subjects_bn,
    bio_en, bio_bn, sort_order, is_published,
  };
}

async function uploadPhoto(file: FormDataEntryValue | null, accessToken: string | null) {
  if (!(file instanceof File) || file.size === 0 || file.size > 8 * 1024 * 1024) {
    return { error: "Choose a teacher photo smaller than 8 MB." } as const;
  }
  const imageType = IMAGE_TYPES[file.type as keyof typeof IMAGE_TYPES];
  if (!imageType) return { error: "Teacher photos must be PNG, JPEG, or WebP." } as const;

  const data = new Uint8Array(await file.arrayBuffer());
  if (!imageType.signature(data)) return { error: "The teacher photo does not match its file type." } as const;

  const config = getSupabaseConfig();
  if (!config) return { error: "Supabase server configuration is missing." } as const;

  const name = `${randomUUID()}.${imageType.extension}`;
  const response = await supabaseFetch(
    `/storage/v1/object/${BUCKET}/${name}`,
    {
      method: "POST",
      headers: { "Content-Type": file.type, "x-upsert": "false" },
      body: data,
    },
    accessToken,
  );
  if (!response.ok) {
    console.error("Teacher photo upload failed with status", response.status);
    return { error: "The teacher photo could not be uploaded." } as const;
  }

  return {
    name,
    url: `${config.url}/storage/v1/object/public/${BUCKET}/${name}`,
  } as const;
}

async function removePhoto(name: string, accessToken: string | null) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(name)) {
    throw new Error("The stored teacher photo name is invalid.");
  }
  const response = await supabaseFetch(
    `/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`,
    { method: "DELETE" },
    accessToken,
  );
  if (!response.ok) throw new Error(`Teacher photo removal failed with status ${response.status}.`);
}

export function OPTIONS() {
  return adminPreflight();
}

export async function GET(request: Request) {
  if (!(await hasAdminAccess(request))) return adminDeniedResponse();
  if (!getSupabaseConfig()) return serviceUnavailable("Supabase server configuration is missing.");

  try {
    const response = await supabaseAdminFetch(request,
      "/rest/v1/teacher_profiles?select=id,name_en,name_bn,role_en,role_bn,qualification_en,qualification_bn,subjects_en,subjects_bn,bio_en,bio_bn,photo_url,photo_name,sort_order,is_published&order=sort_order.asc,name_en.asc&limit=300",
    );
    if (!response.ok) {
      console.error("Admin teacher list failed with status", response.status);
      return apiResponse({ message: "Teacher profiles could not be loaded." }, 502, true);
    }
    return apiResponse({ teachers: await response.json() }, 200, true);
  } catch (error) {
    console.error("Admin teacher list request failed.", error);
    return apiResponse({ message: "Teacher profiles could not be loaded." }, 502, true);
  }
}

export async function POST(request: Request) {
  if (!(await hasAdminAccess(request))) return adminDeniedResponse();
  if (!getSupabaseConfig()) return serviceUnavailable("Supabase server configuration is missing.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiResponse({ message: "The teacher profile form is invalid." }, 400, true);
  }
  const fields = parseFields(form);
  if (!fields) return apiResponse({ message: "Complete all teacher information fields correctly." }, 400, true);

  const accessToken = getAccessToken(request);
  const photo = await uploadPhoto(form.get("photo"), accessToken);
  if ("error" in photo) return apiResponse({ message: photo.error }, 400, true);

  try {
    const response = await supabaseAdminFetch(request, "/rest/v1/teacher_profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ ...fields, photo_url: photo.url, photo_name: photo.name }),
    });
    if (!response.ok) {
      await removePhoto(photo.name, accessToken);
      console.error("Teacher profile create failed with status", response.status);
      return apiResponse({ message: "The teacher profile could not be saved." }, 502, true);
    }
    const rows = await response.json() as TeacherRow[];
    return apiResponse({ teacher: rows[0] }, 201, true);
  } catch (error) {
    console.error("Teacher profile create failed.", error);
    try {
      await removePhoto(photo.name, accessToken);
    } catch (cleanupError) {
      console.error("Failed to clean up an unlinked teacher photo.", cleanupError);
    }
    return apiResponse({ message: "The teacher profile could not be saved." }, 502, true);
  }
}

export async function PUT(request: Request) {
  if (!(await hasAdminAccess(request))) return adminDeniedResponse();
  if (!getSupabaseConfig()) return serviceUnavailable("Supabase server configuration is missing.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiResponse({ message: "The teacher profile form is invalid." }, 400, true);
  }
  const id = form.get("id");
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    return apiResponse({ message: "The teacher profile ID is invalid." }, 400, true);
  }
  const fields = parseFields(form);
  if (!fields) return apiResponse({ message: "Complete all teacher information fields correctly." }, 400, true);

  const accessToken = getAccessToken(request);
  let previousPhoto: Pick<TeacherRow, "photo_name"> | null = null;
  try {
    const existing = await supabaseAdminFetch(request,
      `/rest/v1/teacher_profiles?id=eq.${encodeURIComponent(id)}&select=photo_name`,
    );
    if (!existing.ok) return apiResponse({ message: "The existing teacher profile could not be read." }, 502, true);
    const existingRows = await existing.json() as Array<{ photo_name: string }>;
    if (!existingRows[0]) return apiResponse({ message: "Teacher profile not found." }, 404, true);
    previousPhoto = existingRows[0];

    const submittedFile = form.get("photo");
    const hasNewPhoto = submittedFile instanceof File && submittedFile.size > 0;
    const photo = hasNewPhoto ? await uploadPhoto(submittedFile, accessToken) : null;
    if (photo && "error" in photo) return apiResponse({ message: photo.error }, 400, true);

    const response = await supabaseAdminFetch(request,
      `/rest/v1/teacher_profiles?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          ...fields,
          ...(photo ? { photo_url: photo.url, photo_name: photo.name } : {}),
          updated_at: new Date().toISOString(),
        }),
      },
    );
    if (!response.ok) {
      if (photo) await removePhoto(photo.name, accessToken);
      console.error("Teacher profile update failed with status", response.status);
      return apiResponse({ message: "The teacher profile could not be updated." }, 502, true);
    }

    if (photo && previousPhoto.photo_name) {
      try {
        await removePhoto(previousPhoto.photo_name, accessToken);
      } catch (error) {
        console.error("Updated teacher profile but old photo cleanup failed.", error);
        return apiResponse({ message: "Profile updated, but the previous photo could not be removed." }, 502, true);
      }
    }
    return apiResponse({ message: "Teacher profile updated." }, 200, true);
  } catch (error) {
    console.error("Teacher profile update failed.", error);
    return apiResponse({ message: "The teacher profile could not be updated." }, 502, true);
  }
}

export async function DELETE(request: Request) {
  if (!(await hasAdminAccess(request))) return adminDeniedResponse();
  if (!getSupabaseConfig()) return serviceUnavailable("Supabase server configuration is missing.");

  let id: unknown;
  try {
    const body: unknown = await request.json();
    id = body && typeof body === "object" && "id" in body ? (body as { id: unknown }).id : null;
  } catch {
    return apiResponse({ message: "The teacher deletion request is invalid." }, 400, true);
  }
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    return apiResponse({ message: "The teacher profile ID is invalid." }, 400, true);
  }

  const accessToken = getAccessToken(request);
  try {
    const existing = await supabaseAdminFetch(request,
      `/rest/v1/teacher_profiles?id=eq.${encodeURIComponent(id)}&select=photo_name`,
    );
    if (!existing.ok) return apiResponse({ message: "The teacher profile could not be read." }, 502, true);
    const rows = await existing.json() as Array<{ photo_name: string }>;
    if (!rows[0]) return apiResponse({ message: "Teacher profile not found." }, 404, true);

    const response = await supabaseAdminFetch(request,
      `/rest/v1/teacher_profiles?id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      console.error("Teacher profile delete failed with status", response.status);
      return apiResponse({ message: "The teacher profile could not be deleted." }, 502, true);
    }
    try {
      await removePhoto(rows[0].photo_name, accessToken);
    } catch (error) {
      console.error("Teacher profile was deleted but its photo cleanup failed.", error);
      return apiResponse({ message: "Profile deleted, but its photo could not be removed." }, 502, true);
    }
    return apiResponse({ message: "Teacher profile deleted." }, 200, true);
  } catch (error) {
    console.error("Teacher profile delete failed.", error);
    return apiResponse({ message: "The teacher profile could not be deleted." }, 502, true);
  }
}
