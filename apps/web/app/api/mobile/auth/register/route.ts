// app/api/mobile/auth/register/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { registerUser } from "@/lib/services/auth";
import { ConflictError } from "@/lib/services/errors";
import { signAccessToken, issueRefreshToken } from "@/lib/mobile-auth";

const RegisterSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = RegisterSchema.safeParse(body);

  if (!result.success) {
    return apiError(400, "validation_error", result.error.issues[0]?.message ?? "Datos inválidos");
  }

  try {
    const user = await registerUser(result.data.name, result.data.email, result.data.password);
    const accessToken = signAccessToken(user.id);
    const refreshToken = await issueRefreshToken(user.id);

    return apiSuccess({ accessToken, refreshToken, user }, 201);
  } catch (error) {
    if (error instanceof ConflictError) {
      return apiError(409, "email_taken", error.message);
    }
    throw error;
  }
}
