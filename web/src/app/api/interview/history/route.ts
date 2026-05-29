import { NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/constants";
import { getAuthToken } from "@/lib/proxy";

export async function GET() {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${AI_SERVICE_URL}/interview/history`, { headers: { Authorization: `Bearer ${token}` } });
  return NextResponse.json(await res.json(), { status: res.status });
}
