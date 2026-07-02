// app/api/mobile/adventures/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withMobileAuth } from "@/lib/mobile-auth";
import { listAdventures, createAdventure } from "@/lib/services/adventures";

const CreateAdventureSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  paletteIdx: z.number().int().min(0).max(4).default(0),
  initialMissions: z
    .array(z.object({ title: z.string().min(1), difficulty: z.number().int().min(1).max(3) }))
    .optional(),
});

export const GET = withMobileAuth(async (_req, { userId }) => {
  const adventures = await listAdventures(userId);
  return apiSuccess(adventures);
});

export const POST = withMobileAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json().catch(() => null);
  const result = CreateAdventureSchema.safeParse(body);

  if (!result.success) {
    return apiError(400, "validation_error", result.error.issues[0]?.message ?? "Datos inválidos");
  }

  const adventure = await createAdventure(userId, result.data);
  return apiSuccess(adventure, 201);
});
