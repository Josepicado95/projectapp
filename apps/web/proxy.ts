import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/api/mobile"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // next-auth v5 uses "authjs.session-token" in HTTP and __Secure- prefix in HTTPS
  const sessionToken =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token");

  const isLoggedIn = !!sessionToken;

  if (!isPublic && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
