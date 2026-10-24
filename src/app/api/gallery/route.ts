import { apiResponse, getSupabaseConfig, supabaseFetch } from "@/lib/supabase-server";
import { connection } from "next/server";

type StorageObject = {
  name?: unknown;
};

const BUCKET = "madrasah-gallery";

export async function GET() {
  await connection();
  const config = getSupabaseConfig();
  if (!config) {
    return apiResponse({ message: "Gallery storage is not configured." }, 503);
  }

  try {
    const response = await supabaseFetch(`/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: "", limit: 100, offset: 0, sortBy: { column: "created_at", order: "desc" } }),
    });

    if (!response.ok) {
      console.error("Gallery listing failed with status", response.status);
      return apiResponse({ message: "Uploaded gallery photos could not be loaded." }, 502);
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

    return apiResponse({ images });
  } catch (error) {
    console.error("Gallery listing request failed.", error);
    return apiResponse({ message: "Uploaded gallery photos could not be loaded." }, 502);
  }
}
