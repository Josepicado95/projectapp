// app/api/mobile/auth/login/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { verifyCredentials } from "@/lib/services/auth";
import { signAccessToken, issueRefreshToken } from "@/lib/mobile-auth";

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = LoginSchema.safeParse(body);

  if (!result.success) {
    return apiError(400, "validation_error", result.error.issues[0]?.message ?? "Datos inválidos");
  }

  const user = await verifyCredentials(result.data.email, result.data.password);
  if (!user) {
    return apiError(401, "invalid_credentials", "Correo o contraseña incorrectos");
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = await issueRefreshToken(user.id);

  return apiSuccess({ accessToken, refreshToken, user });
}
