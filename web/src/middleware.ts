import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/resume", "/interview", "/analytics", "/reports"];
const COOKIE_NAME = "careerpilot_token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/resume/:path*",
    "/interview/:path*",
    "/analytics/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
