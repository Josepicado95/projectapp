// app/api/mobile/adventures/[id]/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withMobileAuth } from "@/lib/mobile-auth";
import { getAdventure, updateAdventure, deleteAdventure } from "@/lib/services/adventures";
import { NotFoundError } from "@/lib/services/errors";

type RouteContext = { params: Promise<{ id: string }> };

const UpdateAdventureSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "paused"]),
  paletteIdx: z.number().int().min(0).max(4).default(0),
});

export const GET = withMobileAuth<RouteContext>(async (_req, { userId, params }) => {
  const id = Number((await params).id);
  if (isNaN(id)) return apiError(400, "invalid_id", "ID inválido");

  try {
    const adventure = await getAdventure(userId, id);
    return apiSuccess(adventure);
  } catch (error) {
    if (error instanceof NotFoundError) return apiError(404, "not_found", error.message);
    throw error;
  }
});

export const PATCH = withMobileAuth<RouteContext>(async (req: NextRequest, { userId, params }) => {
  const id = Number((await params).id);
  if (isNaN(id)) return apiError(400, "invalid_id", "ID inválido");

  const body = await req.json().catch(() => null);
  const result = UpdateAdventureSchema.safeParse(body);
  if (!result.success) {
    return apiError(400, "validation_error", result.error.issues[0]?.message ?? "Datos inválidos");
  }

  try {
    await updateAdventure(userId, id, result.data);
    const adventure = await getAdventure(userId, id);
    return apiSuccess(adventure);
  } catch (error) {
    if (error instanceof NotFoundError) return apiError(404, "not_found", error.message);
    throw error;
  }
});

export const DELETE = withMobileAuth<RouteContext>(async (_req, { userId, params }) => {
  const id = Number((await params).id);
  if (isNaN(id)) return apiError(400, "invalid_id", "ID inválido");

  try {
    await deleteAdventure(userId, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof NotFoundError) return apiError(404, "not_found", error.message);
    throw error;
  }
});
