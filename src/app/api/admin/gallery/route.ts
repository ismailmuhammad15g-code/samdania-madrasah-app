import { randomUUID } from "node:crypto";
import {
  adminDeniedResponse,
  adminPreflight,
  apiResponse,
  getSupabaseConfig,
  hasAdminAccess,
  serviceUnavailable,
  supabaseAdminFetch,
} from "@/lib/supabase-server";

const BUCKET = "madrasah-gallery";
const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;
const IMAGE_TYPES = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 },
  "image/webp": { extension: "webp", signature: (bytes: Uint8Array) => bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 },
} as const;

type StorageObject = {
  name?: unknown;
};

export function OPTIONS() {
  return adminPreflight();
}

export async function GET(request: Request) {
  if (!(await hasAdminAccess(request))) return adminDeniedResponse();
  const config = getSupabaseConfig();
  if (!config) return serviceUnavailable("Supabase server configuration is missing.");

  try {
    const response = await supabaseAdminFetch(request, `/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: "", limit: 100, offset: 0, sortBy: { column: "created_at", order: "desc" } }),
    });

    if (!response.ok) {
      console.error("Admin gallery listing failed with status", response.status);
      return apiResponse({ message: "Uploaded gallery photos could not be loaded." }, 502, true);
    }

    const objects: unknown = await response.json();
    const images = Array.isArray(objects)
      ? objects
          .filter((item: StorageObject) => typeof item?.name === "string")
          .map((item: StorageObject) => {
            const name = item.name as string;
            return {
              name,
              url: `${config.url}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(name)}`,
            };
          })
      : [];

    return apiResponse({ images }, 200, true);
  } catch (error) {
    console.error("Admin gallery listing request failed.", error);
    return apiResponse({ message: "Uploaded gallery photos could not be loaded." }, 502, true);
  }
}

export async function POST(request: Request) {
  if (!(await hasAdminAccess(request))) return adminDeniedResponse();
  const config = getSupabaseConfig();
  if (!config) return serviceUnavailable("Supabase server configuration is missing.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiResponse({ message: "Select an image file to upload." }, 400, true);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return apiResponse({ message: "Select an image file to upload." }, 400, true);
  }
  if (file.size === 0 || file.size > MAX_UPLOAD_SIZE) {
    return apiResponse({ message: "Image files must be smaller than 8 MB." }, 400, true);
  }

  const imageType = IMAGE_TYPES[file.type as keyof typeof IMAGE_TYPES];
  if (!imageType) {
    return apiResponse({ message: "Upload a PNG, JPEG, or WebP image." }, 415, true);
  }

  const data = new Uint8Array(await file.arrayBuffer());
  if (!imageType.signature(data)) {
    return apiResponse({ message: "The selected file does not match its image type." }, 415, true);
  }

  const name = `${randomUUID()}.${imageType.extension}`;
  try {
    const response = await supabaseAdminFetch(request,
      `/storage/v1/object/${BUCKET}/${name}`,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "x-upsert": "false",
        },
        body: data,
      },
    );

    if (!response.ok) {
      console.error("Gallery image upload failed with status", response.status);
      return apiResponse({ message: "The image could not be uploaded." }, 502, true);
    }

    return apiResponse({
      image: {
        name,
        url: `${config.url}/storage/v1/object/public/${BUCKET}/${name}`,
      },
    }, 201, true);
  } catch (error) {
    console.error("Gallery image upload failed.", error);
    return apiResponse({ message: "The image could not be uploaded." }, 502, true);
  }
}

export async function DELETE(request: Request) {
  if (!(await hasAdminAccess(request))) return adminDeniedResponse();
  if (!getSupabaseConfig()) return serviceUnavailable("Supabase server configuration is missing.");

  let name: unknown;
  try {
    const body: unknown = await request.json();
    name = body && typeof body === "object" && "name" in body
      ? (body as { name: unknown }).name
      : null;
  } catch {
    return apiResponse({ message: "The gallery item was not valid JSON." }, 400, true);
  }

  if (typeof name !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(name)) {
    return apiResponse({ message: "The selected gallery item is invalid." }, 400, true);
  }

  try {
    const response = await supabaseAdminFetch(request,
      `/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      console.error("Gallery image delete failed with status", response.status);
      return apiResponse({ message: "The image could not be removed." }, 502, true);
    }

    return apiResponse({ message: "Gallery image removed." }, 200, true);
  } catch (error) {
    console.error("Gallery image delete failed.", error);
    return apiResponse({ message: "The image could not be removed." }, 502, true);
  }
}
