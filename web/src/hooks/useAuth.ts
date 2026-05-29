"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api-client";
import type { AuthResponse } from "@/types/api.types";

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  async function login(email: string, password: string) {
    const data = await api.post<AuthResponse>("/auth/login", { email, password });
    setAuth(data.user, data.access_token);
    return data;
  }

  async function register(email: string, username: string, password: string, full_name?: string) {
    const data = await api.post<AuthResponse>("/auth/register", { email, username, password, full_name });
    setAuth(data.user, data.access_token);
    return data;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {}
    clearAuth();
    router.push("/");
  }

  return { user, token, isAuthenticated, login, register, logout };
}
