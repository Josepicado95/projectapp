// app/api/mobile/auth/me/route.ts
import { apiError, apiSuccess } from "@/lib/api-response";
import { withMobileAuth } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export const GET = withMobileAuth(async (_req, { userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return apiError(404, "not_found", "Usuario no encontrado");
  }

  return apiSuccess(user);
});
