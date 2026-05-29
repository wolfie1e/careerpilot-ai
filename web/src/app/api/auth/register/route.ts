import { NextRequest, NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/constants";
import { setAuthCookie } from "@/lib/proxy";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${AI_SERVICE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.ok && data.access_token) {
    await setAuthCookie(data.access_token);
  }
  return NextResponse.json(data, { status: res.status });
}
