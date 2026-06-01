import { NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/constants";
import { getAuthToken } from "@/lib/proxy";

export async function GET() {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${AI_SERVICE_URL}/analytics/overview`, { headers: { Authorization: `Bearer ${token}` } });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Analytics service is unavailable" }, { status: 502 });
  }
}
