// app/api/mobile/adventures/[id]/missions/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withMobileAuth } from "@/lib/mobile-auth";
import { createMission } from "@/lib/services/missions";
import { NotFoundError } from "@/lib/services/errors";

type RouteContext = { params: Promise<{ id: string }> };

const CreateMissionSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  difficulty: z.number().int().min(1).max(3),
});

export const POST = withMobileAuth<RouteContext>(async (req: NextRequest, { userId, params }) => {
  const adventureId = Number((await params).id);
  if (isNaN(adventureId)) return apiError(400, "invalid_id", "ID inválido");

  const body = await req.json().catch(() => null);
  const result = CreateMissionSchema.safeParse(body);
  if (!result.success) {
    return apiError(400, "validation_error", result.error.issues[0]?.message ?? "Datos inválidos");
  }

  try {
    const mission = await createMission(userId, adventureId, result.data);
    return apiSuccess(mission, 201);
  } catch (error) {
    if (error instanceof NotFoundError) return apiError(404, "not_found", error.message);
    throw error;
  }
});
