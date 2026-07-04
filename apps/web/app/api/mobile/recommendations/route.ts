// app/api/mobile/recommendations/route.ts
import { apiSuccess } from "@/lib/api-response";
import { withMobileAuth } from "@/lib/mobile-auth";
import { getLatestCheckInToday } from "@/lib/services/checkins";
import { listPendingMissions } from "@/lib/services/adventures";
import { getRecommendations } from "@/lib/recommender";

export const GET = withMobileAuth(async (_req, { userId }) => {
  const todayCheckIn = await getLatestCheckInToday(userId);

  if (!todayCheckIn) {
    return apiSuccess({
      recommendations: [],
      message: "Haz tu check-in de hoy para recibir recomendaciones",
    });
  }

  const pendingMissions = await listPendingMissions(userId);
  const result = await getRecommendations(todayCheckIn, pendingMissions);

  return apiSuccess(
    result ?? {
      recommendations: [],
      message: "El servicio de recomendaciones no está disponible en este momento",
    }
  );
});
