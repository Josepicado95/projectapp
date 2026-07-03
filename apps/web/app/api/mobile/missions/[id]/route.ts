// app/api/mobile/missions/[id]/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withMobileAuth } from "@/lib/mobile-auth";
import { updateMission, setMissionCompleted, deleteMission } from "@/lib/services/missions";
import { NotFoundError } from "@/lib/services/errors";

type RouteContext = { params: Promise<{ id: string }> };

const PatchMissionSchema = z.union([
  z.object({
    title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
    description: z.string().optional(),
    difficulty: z.number().int().min(1).max(3),
  }),
  z.object({ completed: z.boolean() }),
]);

export const PATCH = withMobileAuth<RouteContext>(async (req: NextRequest, { userId, params }) => {
  const id = Number((await params).id);
  if (isNaN(id)) return apiError(400, "invalid_id", "ID inválido");

  const body = await req.json().catch(() => null);
  const result = PatchMissionSchema.safeParse(body);
  if (!result.success) {
    return apiError(400, "validation_error", "Se espera {title, difficulty} o {completed}");
  }

  try {
    const mission =
      "completed" in result.data
        ? await setMissionCompleted(userId, id, result.data.completed)
        : await updateMission(userId, id, result.data);
    return apiSuccess(mission);
  } catch (error) {
    if (error instanceof NotFoundError) return apiError(404, "not_found", error.message);
    throw error;
  }
});

export const DELETE = withMobileAuth<RouteContext>(async (_req, { userId, params }) => {
  const id = Number((await params).id);
  if (isNaN(id)) return apiError(400, "invalid_id", "ID inválido");

  try {
    await deleteMission(userId, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof NotFoundError) return apiError(404, "not_found", error.message);
    throw error;
  }
});
