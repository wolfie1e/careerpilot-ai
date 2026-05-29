import { NextRequest, NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/constants";
import { getAuthToken } from "@/lib/proxy";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const format = req.nextUrl.searchParams.get("format") || "pdf";
  const res = await fetch(`${AI_SERVICE_URL}/reports/resume/${id}?format=${format}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return NextResponse.json(await res.json(), { status: res.status });

  const blob = await res.blob();
  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": format === "pdf" ? "application/pdf" : "text/markdown",
      "Content-Disposition": `attachment; filename="resume-report.${format === "pdf" ? "pdf" : "md"}"`,
    },
  });
}
