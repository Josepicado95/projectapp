export type MomentKey = "manana" | "tarde" | "atardecer" | "noche";

export type MobileTheme = {
  key: MomentKey;
  gradientFrom: string;
  gradientTo: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
};

const MOMENTS: Record<MomentKey, MobileTheme> = {
  manana: {
    key: "manana",
    gradientFrom: "#A6C2CC",
    gradientTo: "#EFF2EA",
    textPrimary: "#2A332D",
    textSecondary: "#4C5A4E",
    cardBg: "rgba(251,248,241,.56)",
  },
  tarde: {
    key: "tarde",
    gradientFrom: "#57A6CE",
    gradientTo: "#EBF6F1",
    textPrimary: "#14242A",
    textSecondary: "#2E4750",
    cardBg: "rgba(251,250,246,.5)",
  },
  atardecer: {
    key: "atardecer",
    gradientFrom: "#3A3A70",
    gradientTo: "#F9D888",
    textPrimary: "#FBF2E6",
    textSecondary: "rgba(251,242,230,.86)",
    cardBg: "rgba(251,243,233,.46)",
  },
  noche: {
    key: "noche",
    gradientFrom: "#070E28",
    gradientTo: "#2C4884",
    textPrimary: "#ECE6D8",
    textSecondary: "#A7B2AE",
    cardBg: "rgba(26,36,42,.5)",
  },
};

export function getMobileMoment(hour: number): MobileTheme {
  if (hour >= 6 && hour < 11) return MOMENTS.manana;
  if (hour >= 11 && hour < 17) return MOMENTS.tarde;
  if (hour >= 17 && hour < 20) return MOMENTS.atardecer;
  return MOMENTS.noche;
}
