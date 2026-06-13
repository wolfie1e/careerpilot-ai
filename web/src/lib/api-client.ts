const BASE_URL = "/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function getErrorMessage(body: unknown): string {
  if (typeof body === "object" && body !== null) {
    const detail = "detail" in body ? (body as { detail?: unknown }).detail : undefined;
    const message = "message" in body ? (body as { message?: unknown }).message : undefined;
    if (typeof detail === "string") return detail;
    if (typeof message === "string") return message;
    if (Array.isArray(detail)) return detail.map((item) => String(item)).join(", ");
  }
  return "Request failed";
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      // Lazy import to avoid circular dependency
      const { useAuthStore } = await import("@/store/auth.store");
      useAuthStore.getState().clearAuth();
      const from = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      window.location.href = `/login?from=${from}`;
      throw new ApiError(401, "Session expired. Please log in again.");
    }
    const body = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new ApiError(res.status, getErrorMessage(body));
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, {
      method: "POST",
      body: form,
      headers: {},
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { ApiError };
