import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "./api";
import type { AdventureSummary, CheckInData, Recommendation } from "./types";

type RecommendationsResponse = { recommendations: Recommendation[]; message: string };

type DashboardState = {
  adventures: AdventureSummary[];
  checkIns: CheckInData[];
  recommendations: Recommendation[];
  recommendationsMessage: string | null;
  isLoading: boolean;
  error: string | null;
};

const INITIAL_STATE: DashboardState = {
  adventures: [],
  checkIns: [],
  recommendations: [],
  recommendationsMessage: null,
  isLoading: true,
  error: null,
};

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const [adventures, checkIns, recs] = await Promise.all([
        apiRequest<AdventureSummary[]>("/api/mobile/adventures"),
        apiRequest<CheckInData[]>("/api/mobile/checkins?days=14"),
        apiRequest<RecommendationsResponse>("/api/mobile/recommendations"),
      ]);
      setState({
        adventures,
        checkIns,
        recommendations: recs.recommendations,
        recommendationsMessage: recs.recommendations.length === 0 ? recs.message : null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo cargar el dashboard.";
      setState((s) => ({ ...s, isLoading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}
