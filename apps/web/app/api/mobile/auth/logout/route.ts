// app/api/mobile/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { revokeRefreshToken } from "@/lib/mobile-auth";

const LogoutSchema = z.object({ refreshToken: z.string().min(1) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = LogoutSchema.safeParse(body);

  if (!result.success) {
    return apiError(400, "validation_error", "Falta refreshToken");
  }

  await revokeRefreshToken(result.data.refreshToken);
  return new NextResponse(null, { status: 204 });
}
