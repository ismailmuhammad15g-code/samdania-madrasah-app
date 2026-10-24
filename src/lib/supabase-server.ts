type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL
  )?.trim().replace(/\/+$/, "");
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !anonKey) return null;

  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" &&
      parsed.hostname !== "localhost" &&
      parsed.hostname !== "127.0.0.1"
    ) return null;
  } catch {
    return null;
  }

  return { url, anonKey };
}

export function getAccessToken(request: Request): string | null {
  return request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

export async function hasAdminAccess(request: Request): Promise<boolean> {
  const token = getAccessToken(request);
  const config = getSupabaseConfig();
  if (!token || !config) return false;

  try {
    const response = await fetch(`${config.url}/auth/v1/user`, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const user: unknown = await response.json();
    if (!user || typeof user !== "object" || !("app_metadata" in user)) return false;

    const metadata = user.app_metadata;
    return Boolean(
      metadata &&
      typeof metadata === "object" &&
      "main_madrasah_admin" in metadata &&
      metadata.main_madrasah_admin === true
    );
  } catch (error) {
    console.error("Supabase Auth admin verification failed.", error);
    return false;
  }
}

export function apiResponse(
  body: unknown,
  status = 200,
  includeCors = false,
): Response {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });

  if (includeCors) {
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    headers.set("Access-Control-Max-Age", "600");
  }

  return new Response(JSON.stringify(body), { status, headers });
}

export function adminPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Max-Age": "600",
      "Cache-Control": "no-store",
    },
  });
}

export function adminDeniedResponse(): Response {
  return apiResponse(
    { message: "Sign in with a Supabase account authorized to manage the madrasah website." },
    401,
    true,
  );
}

export async function supabaseFetch(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null,
): Promise<Response> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase public URL or anon key is missing or invalid.");

  const headers = new Headers(init.headers);
  headers.set("apikey", config.anonKey);
  headers.set("Authorization", `Bearer ${accessToken || config.anonKey}`);
  headers.set("Accept", "application/json");

  return fetch(`${config.url}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export function supabaseAdminFetch(
  request: Request,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return supabaseFetch(path, init, getAccessToken(request));
}

export function serviceUnavailable(message: string): Response {
  return apiResponse({ message }, 503, true);
}
