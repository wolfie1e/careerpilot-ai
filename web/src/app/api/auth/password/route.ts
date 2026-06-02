import { NextRequest, NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/constants";
import { getAuthToken } from "@/lib/proxy";

export async function POST(req: NextRequest) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${AI_SERVICE_URL}/auth/password`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
