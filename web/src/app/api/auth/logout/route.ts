import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/proxy";

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
