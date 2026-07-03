// app/api/mobile/auth/refresh/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { rotateRefreshToken } from "@/lib/mobile-auth";

const RefreshSchema = z.object({ refreshToken: z.string().min(1) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = RefreshSchema.safeParse(body);

  if (!result.success) {
    return apiError(400, "validation_error", "Falta refreshToken");
  }

  const rotated = await rotateRefreshToken(result.data.refreshToken);
  if (!rotated) {
    return apiError(401, "invalid_refresh_token", "El refresh token es inválido, expiró o ya fue usado");
  }

  return apiSuccess({ accessToken: rotated.accessToken, refreshToken: rotated.refreshToken });
}
