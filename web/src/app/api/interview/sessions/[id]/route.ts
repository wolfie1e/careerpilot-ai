import { NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/constants";
import { getAuthToken } from "@/lib/proxy";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${AI_SERVICE_URL}/interview/sessions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return NextResponse.json(await res.json(), { status: res.status });
}
