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

  // Next.js middleware runs on the server, so we can't reliably read localStorage for the admin_token here.
  // The actual admin protection is handled client-side in the admin_dashboard/page.js useEffect hook.
  // This is acceptable for a Next.js App Router app without a dedicated server-side session backend.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user_dashboard/:path*",
    "/admin_dashboard/:path*"
  ],
};