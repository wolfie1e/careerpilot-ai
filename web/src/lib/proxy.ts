import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AI_SERVICE_URL, COOKIE_NAME } from "./constants";

const AI_PROXY_TIMEOUT_MS = 60_000;

export async function proxyToAI(
  req: NextRequest,
  path: string,
  options: {
    method?: string;
    body?: unknown;
    isFormData?: boolean;
  } = {}
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let fetchOptions: RequestInit = {
    method: options.method || req.method,
    headers,
  };

  if (options.isFormData) {
    const formData = await req.formData();
    fetchOptions.body = formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(options.body);
  } else if (req.method !== "GET" && req.method !== "DELETE") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      headers["Content-Type"] = "application/json";
      const text = await req.text();
      if (text) fetchOptions.body = text;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      fetchOptions.body = formData;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_PROXY_TIMEOUT_MS);
  let res: Response;

  try {
    res = await fetch(`${AI_SERVICE_URL}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
    });
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    return NextResponse.json(
      { detail: isTimeout ? "AI service request timed out" : "AI service is unavailable" },
      { status: isTimeout ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeout);
  }

  const data = await res.json().catch(() => null);

  return NextResponse.json(data, { status: res.status });
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}
