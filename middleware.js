import { NextResponse } from "next/server";

export function middleware(request) {
  // Extract path
  const path = request.nextUrl.pathname;

  // Protect User Dashboard
  if (path.startsWith("/user_dashboard")) {
    const userAuthToken = request.cookies.get("auth-token")?.value;
    if (!userAuthToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect Admin Dashboard
  if (path.startsWith("/admin_dashboard")) {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin_login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user_dashboard/:path*",
    "/admin_dashboard/:path*"
  ],
};