// app/api/mobile/checkins/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withMobileAuth } from "@/lib/mobile-auth";
import { saveCheckIn, listCheckIns, listRecentCheckIns, getTodayCheckIn } from "@/lib/services/checkins";

const CheckInSchema = z.object({
  energy: z.number().int().min(1).max(5),
  mood: z.number().int().min(1).max(5),
  stress: z.number().int().min(1).max(5),
  sleep: z.number().int().min(1).max(5),
});

export const GET = withMobileAuth(async (req: NextRequest, { userId }) => {
  const params = req.nextUrl.searchParams;

  if (params.get("today") === "true") {
    const checkIn = await getTodayCheckIn(userId);
    return apiSuccess({ checkIn });
  }

  const daysParam = params.get("days");
  if (daysParam) {
    const days = Math.min(60, Math.max(1, Number(daysParam) || 7));
    const checkIns = await listRecentCheckIns(userId, days);
    return apiSuccess(checkIns);
  }

  const limitParam = params.get("limit");
  const limit = limitParam ? Math.min(30, Math.max(1, Number(limitParam) || 7)) : 7;
  const checkIns = await listCheckIns(userId, limit);
  return apiSuccess(checkIns);
});

export const POST = withMobileAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json().catch(() => null);
  const result = CheckInSchema.safeParse(body);
  if (!result.success) {
    return apiError(400, "validation_error", "Los valores deben estar entre 1 y 5");
  }

  const { checkIn, created } = await saveCheckIn(userId, result.data);
  return apiSuccess(checkIn, created ? 201 : 200);
});
