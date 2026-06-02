"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api-client";
import type { AuthResponse, User } from "@/types/api.types";

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, setAuth, clearAuth, updateUser } = useAuthStore();

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

  async function refreshUser() {
    const data = await api.get<User>("/auth/me");
    updateUser(data);
    return data;
  }

  async function updateProfile(payload: Pick<User, "username" | "full_name" | "avatar_url">) {
    const data = await api.patch<User>("/auth/me", payload);
    updateUser(data);
    return data;
  }

  async function changePassword(current_password: string, new_password: string) {
    return api.post<{ message: string }>("/auth/password", { current_password, new_password });
  }

  return { user, token, isAuthenticated, login, register, logout, refreshUser, updateProfile, changePassword };
}
