import { NextResponse } from "next/server";

export function middleware(request) {
    const token = request.cookies.get('auth-token')

    // if no token found
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()

}

export const config = {
    matcher: [
        '/report_crime/:path*',
    ]
}