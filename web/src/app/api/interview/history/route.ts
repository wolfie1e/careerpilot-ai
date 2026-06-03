import { NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/constants";
import { getAuthToken } from "@/lib/proxy";

export async function GET(req: Request) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const upstream = new URL(`${AI_SERVICE_URL}/interview/history`);
  url.searchParams.forEach((value, key) => {
    if (value) upstream.searchParams.set(key, value);
  });

  const res = await fetch(upstream, { headers: { Authorization: `Bearer ${token}` } });
  return NextResponse.json(await res.json(), { status: res.status });
}
