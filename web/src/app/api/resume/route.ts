import { NextRequest, NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/constants";
import { getAuthToken } from "@/lib/proxy";

export async function GET() {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${AI_SERVICE_URL}/resumes/`, { headers: { Authorization: `Bearer ${token}` } });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(req: NextRequest) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const res = await fetch(`${AI_SERVICE_URL}/resumes/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
