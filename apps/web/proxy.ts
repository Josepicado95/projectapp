import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import type { NextRequest, NextFetchEvent } from "next/server";

const { auth } = NextAuth(authConfig);

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  // auth from next-auth works as proxy at runtime but its TypeScript overloads
  // don't expose this call signature directly
  return (auth as any)(request, event);
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
