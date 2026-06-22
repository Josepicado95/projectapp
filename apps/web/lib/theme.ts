export type MomentKey = "manana" | "tarde" | "atardecer" | "noche";

export interface MomentTheme {
  key: MomentKey;
  label: string;
  greeting: string;
  subtext: string;
  skyGradient: string;
  sunGlow: string;
  sunRight: string;
  sunTop: string;
  hazeBand: string;
  hillFar: string;
  hillNear: string;
  hillSheen: string;
  headerInk: string;
  headerSub: string;
  glassBg: string;
  glassBorder: string;
  glassShadow: string;
  glassInner: string;
  cardInk: string;
  cardSub: string;
  trackBg: string;
  avatarBg: string;
  avatarInk: string;
  starOpacity: number;
}

export type CardTheme = Pick<
  MomentTheme,
  "glassBg" | "glassBorder" | "glassShadow" | "glassInner" | "cardInk" | "cardSub" | "trackBg"
>;

const MOMENTS: Record<MomentKey, MomentTheme> = {
  manana: {
    key: "manana",
    label: "Mañana",
    greeting: "Buenos días",
    subtext: "Un nuevo tramo te espera. Empieza suave.",
    skyGradient: "linear-gradient(180deg,#F9D9B0 0%,#F1B98E 16%,#CFCBB4 44%,#8FC0DA 76%,#79B0D0 100%)",
    sunGlow: "radial-gradient(circle,#FBEAC9 0%,#F4CBA0 52%,rgba(244,203,160,0) 72%)",
    sunRight: "460px", sunTop: "90px",
    hazeBand: "rgba(251,248,241,.45)",
    hillFar: "#A9BFA8", hillNear: "#7E9A86", hillSheen: "rgba(255,252,242,.35)",
    headerInk: "#2A332D", headerSub: "#4C5A4E",
    glassBg: "rgba(251,248,241,.56)", glassBorder: "rgba(255,255,255,.72)",
    glassShadow: "rgba(42,51,45,.14)", glassInner: "rgba(255,255,255,.55)",
    cardInk: "#2A332D", cardSub: "#6A746C", trackBg: "rgba(42,51,45,.12)",
    avatarBg: "#2A332D", avatarInk: "#FBF8F1", starOpacity: 0,
  },
  tarde: {
    key: "tarde",
    label: "Tarde",
    greeting: "Buenas tardes",
    subtext: "Vas a buen ritmo. Sigue el camino.",
    skyGradient: "linear-gradient(180deg,#2E86CC 0%,#4F9CD6 32%,#83BEE4 64%,#BCDAEC 100%)",
    sunGlow: "radial-gradient(circle,#FFFAF0 0%,#FBE9C8 48%,rgba(251,233,200,0) 70%)",
    sunRight: "460px", sunTop: "70px",
    hazeBand: "rgba(255,255,255,.4)",
    hillFar: "#94B49E", hillNear: "#76927F", hillSheen: "rgba(255,255,255,.4)",
    headerInk: "#14242A", headerSub: "#2E4750",
    glassBg: "rgba(251,250,246,.5)", glassBorder: "rgba(255,255,255,.78)",
    glassShadow: "rgba(20,40,60,.18)", glassInner: "rgba(255,255,255,.6)",
    cardInk: "#1E2A2C", cardSub: "#5E6B6E", trackBg: "rgba(20,40,50,.12)",
    avatarBg: "#1E2A2C", avatarInk: "#FBF8F1", starOpacity: 0,
  },
  atardecer: {
    key: "atardecer",
    label: "Atardecer",
    greeting: "Cae la tarde",
    subtext: "Buen momento para un paso suave.",
    skyGradient: "linear-gradient(180deg,#4A3D6E 0%,#8A5F86 27%,#D07F6B 57%,#EFA877 81%,#F6D2A4 100%)",
    sunGlow: "radial-gradient(circle,#FCE4B8 0%,#F2A877 55%,rgba(242,168,119,0) 74%)",
    sunRight: "420px", sunTop: "320px",
    hazeBand: "rgba(247,196,150,.4)",
    hillFar: "#9A9376", hillNear: "#73704F", hillSheen: "rgba(255,225,180,.4)",
    headerInk: "#FBF2E6", headerSub: "rgba(251,242,230,.86)",
    glassBg: "rgba(251,243,233,.46)", glassBorder: "rgba(255,250,240,.6)",
    glassShadow: "rgba(60,30,40,.22)", glassInner: "rgba(255,250,240,.5)",
    cardInk: "#2C2522", cardSub: "#6E5F55", trackBg: "rgba(60,40,30,.14)",
    avatarBg: "#3A2A30", avatarInk: "#FBF2E6", starOpacity: 0,
  },
  noche: {
    key: "noche",
    label: "Noche",
    greeting: "Buenas noches",
    subtext: "Llegaste hasta aquí. Mañana seguimos el camino.",
    skyGradient: "linear-gradient(180deg,#0E1630 0%,#1B2647 40%,#27375E 72%,#34496F 100%)",
    sunGlow: "radial-gradient(circle,#F0EAD8 0%,#C9C7B4 46%,rgba(201,199,180,0) 68%)",
    sunRight: "460px", sunTop: "68px",
    hazeBand: "rgba(52,73,111,.5)",
    hillFar: "#2E4742", hillNear: "#233A38", hillSheen: "rgba(120,160,150,.16)",
    headerInk: "#ECE6D8", headerSub: "#A7B2AE",
    glassBg: "rgba(26,36,42,.5)", glassBorder: "rgba(236,230,216,.16)",
    glassShadow: "rgba(0,0,0,.4)", glassInner: "rgba(236,230,216,.1)",
    cardInk: "#ECE6D8", cardSub: "#93A0A0", trackBg: "rgba(236,230,216,.14)",
    avatarBg: "#E3A878", avatarInk: "#1E282A", starOpacity: 1,
  },
};

export function getMoment(hour: number): MomentTheme {
  if (hour >= 6 && hour < 11) return MOMENTS.manana;
  if (hour >= 11 && hour < 17) return MOMENTS.tarde;
  if (hour >= 17 && hour < 20) return MOMENTS.atardecer;
  return MOMENTS.noche;
}
