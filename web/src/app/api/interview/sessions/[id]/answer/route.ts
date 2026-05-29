import { NextRequest, NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/constants";
import { getAuthToken } from "@/lib/proxy";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const res = await fetch(`${AI_SERVICE_URL}/interview/sessions/${id}/answer`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
