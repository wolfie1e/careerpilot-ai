import { NextRequest, NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/constants";
import { getAuthToken } from "@/lib/proxy";

export async function POST(req: NextRequest) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const res = await fetch(`${AI_SERVICE_URL}/matcher/match`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
