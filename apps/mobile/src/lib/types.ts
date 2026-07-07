export type AdventureSummary = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  paletteIdx: number;
};

export type MissionData = {
  id: number;
  adventureId: number;
  title: string;
  description: string | null;
  difficulty: number;
  completed: boolean;
};

export type AdventureDetail = AdventureSummary & {
  missions: MissionData[];
};

export type CheckInData = {
  id: number;
  date: string;
  energy: number;
  mood: number;
  stress: number;
  sleep: number;
};

export type Recommendation = {
  id: number;
  title: string;
  difficulty: number;
  reason: string;
};
