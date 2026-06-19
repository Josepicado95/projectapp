const RECOMMENDER_URL = process.env.RECOMMENDER_URL ?? "http://localhost:8000";

export type RecommendedMission = {
  id: number;
  title: string;
  difficulty: number;
  reason: string;
};

export type RecommendationResult = {
  recommendations: RecommendedMission[];
  message: string;
};

type CheckInData = {
  energy: number;
  mood: number;
  stress: number;
  sleep: number;
};

type MissionInput = {
  id: number;
  title: string;
  difficulty: number;
  completed: boolean;
};

export async function getRecommendations(
  checkIn: CheckInData,
  missions: MissionInput[]
): Promise<RecommendationResult | null> {
  try {
    const response = await fetch(`${RECOMMENDER_URL}/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        energy: checkIn.energy,
        mood: checkIn.mood,
        stress: checkIn.stress,
        sleep: checkIn.sleep,
        missions,
      }),
      cache: "no-store",
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
