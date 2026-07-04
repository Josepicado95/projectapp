"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import NewAdventurePanel from "./NewAdventurePanel";
import MissionEditorModal, { MISSION_LEVELS, hexToRgb } from "./MissionEditorModal";
import AdventureEditorModal from "./AdventureEditorModal";
import ThreeBackground from "@/components/background/ThreeBackground";
import { logoutAction } from "@/app/actions/auth";
import { MomentTheme } from "@/lib/theme";
import { PALETTES } from "@/lib/palettes";
import type { Adventure, Mission } from "@/lib/generated/prisma/client";

type AdventureWithMissions = Adventure & { missions: Mission[] };
type Rec = { id: number; title: string; reason: string };
type RecsResult = { recommendations: Rec[]; message: string };

const DIM = "rgba(236,230,216,.18)";

const FILTER_CHIPS: { key: "all" | "active" | "done"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "active", label: "En curso" },
  { key: "done", label: "Listas" },
];

const LEVELS = [
  { name: "Caminante",  min: 0,    max: 99,    color: "#7E9A86" },
  { name: "Explorador", min: 100,  max: 249,   color: "#5B9BD1" },
  { name: "Aventurero", min: 250,  max: 499,   color: "#9B7ED1" },
  { name: "Héroe",      min: 500,  max: 999,   color: "#E3A878" },
  { name: "Leyenda",    min: 1000, max: 99999, color: "#E36878" },
];

const INPUT_STYLE: React.CSSProperties = {
  border: "1px solid rgba(236,230,216,.3)",
  borderRadius: 10, padding: "9px 12px", fontSize: 13,
  color: "#2A332D", outline: "none",
  background: "rgba(251,248,241,.9)", width: "100%", boxSizing: "border-box",
};

type WeekDay = { done: boolean; label: string; isToday: boolean };
type CheckInValues = { energy: number; mood: number; stress: number; sleep: number };

type Props = {
  theme: MomentTheme;
  firstName: string;
  initial: string;
};

type EditorTarget = { adventureId: number; mission: Mission | null };
type LoadState = "loading" | "ready" | "error";

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"] as const;

type DashboardSnapshot = {
  adventures: AdventureWithMissions[];
  todayCheckIn: CheckInValues | null;
  streak: number;
  weekDays: WeekDay[];
  recommendations: RecsResult;
};

// No state access — safe to call from anywhere, including a useEffect's own
// closure, without tripping the "setState in effect" lint rule.
async function fetchDashboardSnapshot(): Promise<DashboardSnapshot | null> {
  const [advRes, todayRes, historyRes, recsRes] = await Promise.all([
    fetch("/api/mobile/adventures?include=missions"),
    fetch("/api/mobile/checkins?today=true"),
    fetch("/api/mobile/checkins?limit=30"),
    fetch("/api/mobile/recommendations"),
  ]);

  if ([advRes, todayRes, historyRes, recsRes].some((r) => r.status === 401)) {
    window.location.href = "/login";
    return null;
  }
  if (!advRes.ok || !todayRes.ok || !historyRes.ok || !recsRes.ok) {
    throw new Error("load_failed");
  }

  const adventures = await advRes.json();
  const todayData: { checkIn: CheckInValues | null } = await todayRes.json();
  const history: { date: string }[] = await historyRes.json();

  const ciDays = new Set(
    history.map((ci) => {
      const d = new Date(ci.date);
      return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    })
  );
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    if (ciDays.has(key)) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (6 - i));
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    return { done: ciDays.has(key), label: DAY_LABELS[d.getUTCDay()], isToday: i === 6 };
  });

  const recommendations = await recsRes.json();

  return { adventures, todayCheckIn: todayData.checkIn, streak, weekDays, recommendations };
}

export default function DashboardBody({ theme, firstName, initial }: Props) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [adventures, setAdventures] = useState<AdventureWithMissions[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<CheckInValues | null>(null);
  const [streak, setStreak] = useState(0);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [recommendations, setRecommendations] = useState<RecsResult | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [fadeTick, setFadeTick] = useState(0);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [showAdvModal, setShowAdvModal] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "done">("all");

  // Used by children after a mutation (create/edit/delete) to pull fresh data.
  const refresh = useCallback(async () => {
    try {
      const snap = await fetchDashboardSnapshot();
      if (!snap) return;
      setAdventures(snap.adventures);
      setTodayCheckIn(snap.todayCheckIn);
      setStreak(snap.streak);
      setWeekDays(snap.weekDays);
      setRecommendations(snap.recommendations);
      setLoadState("ready");
    } catch {
      setLoadState((prev) => (prev === "loading" ? "error" : prev));
    }
  }, []);

  // Deliberately NOT calling `refresh()` here: this closure lives entirely inside
  // the effect (never handed out as a stable reference elsewhere), with its own
  // cancellation guard, so a still-in-flight initial load can't clobber state
  // after the component unmounts. It duplicates refresh's "commit" step rather
  // than calling it, because referencing `refresh` here — even just to await it —
  // would make the effect indistinguishable, to the linter, from calling a
  // known state-setting function directly inside an effect.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await fetchDashboardSnapshot();
        if (cancelled || !snap) return;
        setAdventures(snap.adventures);
        setTodayCheckIn(snap.todayCheckIn);
        setStreak(snap.streak);
        setWeekDays(snap.weekDays);
        setRecommendations(snap.recommendations);
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState((prev) => (prev === "loading" ? "error" : prev));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const doneMissions = adventures
    .filter((a) => a.status !== "completed")
    .reduce((sum, a) => sum + a.missions.filter((m) => m.completed).length, 0);
  const totalMissions = adventures
    .filter((a) => a.status !== "completed")
    .reduce((sum, a) => sum + a.missions.length, 0);

  const activeAdventures = adventures.filter((a) => a.status !== "completed");
  const selected = activeAdventures.find((a) => a.id === selectedId) ?? null;

  const filteredAdventures = activeAdventures
    .filter((a) => {
      const q = search.toLowerCase().trim();
      if (q && !a.title.toLowerCase().includes(q) && !a.missions.some((m) => m.title.toLowerCase().includes(q))) return false;
      if (activeFilter === "active") return a.missions.some((m) => !m.completed);
      if (activeFilter === "done") return a.missions.length > 0 && a.missions.every((m) => m.completed);
      return true;
    })
    .sort((a, b) => {
      const aDone = a.missions.length > 0 && a.missions.every((m) => m.completed);
      const bDone = b.missions.length > 0 && b.missions.every((m) => m.completed);
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
    });

  const totalXp = adventures.reduce((sum, a) =>
    sum + a.missions.filter((m) => m.completed).reduce((s, m) => {
      const xp = m.difficulty === 3 ? 25 : m.difficulty === 2 ? 15 : 10;
      return s + xp;
    }, 0)
  , 0);
  const currentLevel = LEVELS.find((l) => totalXp >= l.min && totalXp <= l.max) ?? LEVELS[0];
  const levelRange = currentLevel.max - currentLevel.min;
  const levelPct = levelRange > 0 ? Math.min(100, Math.round(((totalXp - currentLevel.min) / levelRange) * 100)) : 100;

  if (loadState === "loading" || loadState === "error") {
    return (
      <div style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
        <ThreeBackground moment={theme.key} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: theme.cardSub, fontSize: 15, zIndex: 1 }}>
          {loadState === "loading" ? "Cargando tu dashboard…" : "No se pudo cargar el dashboard. Intenta recargar la página."}
        </div>
      </div>
    );
  }

  function selectAdventure(id: number) {
    if (id === selectedId) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
    }
    setFadeTick((t) => t + 1);
  }

  function goBack() {
    setSelectedId(null);
    setFadeTick((t) => t + 1);
  }

  const panelAnim = fadeTick % 2 === 0 ? "av-riseA .22s ease both" : "av-riseB .22s ease both";
  const glassBorder = `1px solid ${theme.glassBorder}`;

  return (
    <div style={{ height: "100vh", overflow: "hidden", position: "relative" }}>
      <ThreeBackground moment={theme.key} />
      <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 1 }}>

        {/* Nav Rail */}
        <div className="av-nav-rail" style={{
          flexShrink: 0, width: 84,
          background: "rgba(10,15,26,.66)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(236,230,216,.1)",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "22px 0",
          isolation: "isolate",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "radial-gradient(circle at 60% 35%, #F0EAD8, #9DB6A4)",
            boxShadow: "0 0 18px rgba(240,234,216,.3)",
            marginBottom: 24, flexShrink: 0,
          }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 15,
                background: "rgba(91,155,209,.2)", border: "1px solid rgba(146,199,230,.45)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 4, color: "#CDE6F5", cursor: "pointer",
              }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>⛰</span>
                <span style={{ fontSize: 9, fontWeight: 600 }}>Aventuras</span>
              </div>
            </Link>
            <Link href="/checkin" style={{ textDecoration: "none" }}>
              <div style={{
                position: "relative",
                width: 56, height: 56, borderRadius: 15,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 4, color: "#9FB4C6", cursor: "pointer",
              }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>♡</span>
                <span style={{ fontSize: 9, fontWeight: 600 }}>Check-in</span>
                {!todayCheckIn && (
                  <span style={{
                    position: "absolute", top: 9, right: 13,
                    width: 9, height: 9, borderRadius: "50%",
                    background: "#7E9A86", border: "2px solid rgba(10,15,26,.9)",
                  }} />
                )}
              </div>
            </Link>
            <Link href="/progress" style={{ textDecoration: "none" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 15,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 4, color: "#9FB4C6", cursor: "pointer",
              }}>
                <span style={{ fontSize: 17, lineHeight: 1 }}>◷</span>
                <span style={{ fontSize: 9, fontWeight: 600 }}>Progreso</span>
              </div>
            </Link>
          </div>
          <div style={{ marginTop: "auto" }}>
            <form action={logoutAction}>
              <button
                type="submit"
                title="Cerrar sesión"
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: theme.avatarBg, color: theme.avatarInk,
                  border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {initial}
              </button>
            </form>
          </div>
        </div>

      <div style={{
        flex: 1, display: "flex", justifyContent: "space-between", gap: 24, overflow: "hidden",
        padding: "30px 34px",
      }}>

        {/* ── Columna izquierda (glass card) ── */}
        <div style={{
          flexShrink: 0, width: 438, display: "flex", flexDirection: "column", minHeight: 0,
          background: theme.glassBg,
          backdropFilter: "blur(18px) saturate(1.1)",
          WebkitBackdropFilter: "blur(18px) saturate(1.1)",
          border: glassBorder, borderRadius: 22, padding: 18, boxSizing: "border-box",
        }}>
          {/* Greeting */}
          <div style={{ flexShrink: 0, marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 25, color: theme.headerInk, lineHeight: 1.1 }}>
              {theme.greeting}, {firstName}
            </div>
            <div style={{ fontSize: 13.5, color: theme.headerSub, marginTop: 5 }}>
              {theme.subtext}
            </div>
          </div>

          {/* Search input */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aventuras o misiones…"
              style={{
                width: "100%", fontFamily: "var(--font-hanken)", fontSize: 13.5,
                color: theme.cardInk, background: theme.trackBg,
                border: `1px solid ${theme.glassBorder}`, borderRadius: 12,
                padding: "10px 14px 10px 38px", outline: "none", boxSizing: "border-box",
              }}
            />
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: theme.cardSub, fontSize: 15, pointerEvents: "none" }}>⌕</span>
          </div>

          {/* Filter chips */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {FILTER_CHIPS.map((fc) => {
              const isActive = activeFilter === fc.key;
              return (
                <div key={fc.key} onClick={() => setActiveFilter(fc.key)} style={{
                  flex: 1, textAlign: "center", fontSize: 12, fontWeight: 600,
                  color: isActive ? "#E3A878" : theme.cardSub,
                  background: isActive ? "rgba(227,168,120,.18)" : theme.trackBg,
                  border: `1px solid ${isActive ? "rgba(227,168,120,.5)" : theme.glassBorder}`,
                  borderRadius: 999, padding: "6px 0", cursor: "pointer",
                  transition: "all .18s ease",
                }}>
                  {fc.label}
                </div>
              );
            })}
          </div>

          {/* Cards */}
          <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
          <div style={{ height: "100%", overflowY: "auto", paddingRight: 4 }}>
          {activeAdventures.length === 0 ? (
            <div style={{ color: theme.cardSub, fontSize: 14, lineHeight: 1.6 }}>
              Todavía no tienes aventuras activas.{" "}
              <span style={{ color: theme.cardInk, fontWeight: 500 }}>Crea la primera con el panel de la derecha.</span>
            </div>
          ) : filteredAdventures.length === 0 ? (
            <div style={{ color: theme.cardSub, fontSize: 13.5, fontStyle: "italic" }}>
              Sin resultados para esta búsqueda.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {filteredAdventures.map((adventure, i) => {
                const done = adventure.missions.filter((m) => m.completed).length;
                const total = adventure.missions.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const isSel = adventure.id === selectedId;
                const nextMission = adventure.missions.find((m) => !m.completed);
                const nextText = total === 0
                  ? "Aún sin misiones"
                  : nextMission
                    ? `Siguiente: ${nextMission.title}`
                    : "¡Aventura completada!";

                return (
                  <div
                    key={adventure.id}
                    onClick={() => selectAdventure(adventure.id)}
                    style={{
                      background: isSel ? "rgba(91,155,209,.18)" : "rgba(236,230,216,.06)",
                      border: `1px solid ${isSel ? "rgba(146,199,230,.55)" : "rgba(236,230,216,.12)"}`,
                      borderRadius: 16, padding: 14,
                      display: "flex", gap: 13, alignItems: "center",
                      cursor: "pointer",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
                      transition: "background .22s ease, border-color .22s ease",
                    }}
                  >
                    <div style={{
                      flexShrink: 0, width: 46, height: 46, borderRadius: 12,
                      background: PALETTES[adventure.paletteIdx % PALETTES.length],
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,.18)",
                      position: "relative", overflow: "hidden",
                    }}>
                      <div style={{ position: "absolute", left: 9, top: 9, width: 12, height: 12, borderRadius: "50%", background: "rgba(255,255,255,.6)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 15, color: theme.cardInk, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {adventure.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#93A0A0", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {nextText}
                      </div>
                      <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ flex: 1, height: 5, borderRadius: 999, background: theme.trackBg }}>
                          <div style={{ height: 5, borderRadius: 999, width: `${pct}%`, background: "linear-gradient(90deg,#7E9A86,#5B9BD1)", transition: "width .3s ease" }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#8593A0", whiteSpace: "nowrap" }}>{done} de {total}</span>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, fontSize: 20, lineHeight: 1, color: isSel ? "#92C7E6" : theme.cardSub, transition: "color .2s ease" }}>›</div>
                  </div>
                );
              })}
            </div>
          )}
          </div>{/* /cards scroll inner */}
          {/* fade bottom */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 40, background: `linear-gradient(180deg, rgba(14,22,48,0), ${theme.key === "noche" ? "rgba(15,21,38,.5)" : "rgba(0,0,0,.08)"})`, pointerEvents: "none" }} />
          </div>{/* /cards scroll outer */}

          {/* Footer inline (dentro del glass card) */}
          <div style={{ flexShrink: 0, marginTop: 8, borderTop: "1px solid rgba(236,230,216,.1)", paddingTop: 14, paddingBottom: 2, display: "flex", alignItems: "center", gap: 14 }}>
            {/* Racha */}
            <div style={{ flexShrink: 0, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 22, color: theme.cardInk, lineHeight: 1 }}>
                {streak}
              </div>
              <div style={{ fontSize: 11, color: theme.cardSub, marginTop: 3 }}>días racha</div>
            </div>
            <div style={{ width: 1, height: 36, background: "rgba(236,230,216,.12)", flexShrink: 0 }} />
            {/* Misiones */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                <span style={{ fontSize: 11.5, color: "#A7B2AE" }}>Misiones</span>
                <span style={{ fontSize: 11.5, color: "#9FB4C6" }}>{doneMissions}/{totalMissions}</span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: theme.trackBg }}>
                <div style={{ height: 5, borderRadius: 999, width: totalMissions > 0 ? `${Math.round(doneMissions / totalMissions * 100)}%` : "0%", background: "linear-gradient(90deg,#7E9A86,#5B9BD1)", transition: "width .3s ease" }} />
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: "rgba(236,230,216,.12)", flexShrink: 0 }} />
            {/* XP + nivel */}
            <div style={{ flexShrink: 0, textAlign: "center", minWidth: 76 }}>
              <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 17, color: "#E3A878", lineHeight: 1 }}>{totalXp} XP</div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: currentLevel.color, marginTop: 3, letterSpacing: ".05em" }}>{currentLevel.name.toUpperCase()}</div>
              <div style={{ height: 3, borderRadius: 999, background: "rgba(236,230,216,.14)", marginTop: 6 }}>
                <div style={{ height: 3, borderRadius: 999, width: `${levelPct}%`, background: `linear-gradient(90deg,${currentLevel.color},#E3A878)`, transition: "width .5s ease" }} />
              </div>
            </div>
          </div>
        </div>{/* /columna izquierda */}

        {/* ── Rail derecho: panel contextual (altura = contenido, máx = 100% del contenedor) ── */}
        <div style={{
          flexShrink: 0, width: 372,
          alignSelf: "flex-start",
          maxHeight: "100%",
          background: theme.glassBg,
          backdropFilter: "blur(20px) saturate(1.15)",
          WebkitBackdropFilter: "blur(20px) saturate(1.15)",
          border: glassBorder, borderRadius: 24,
          boxShadow: `0 18px 48px ${theme.glassShadow}, inset 0 1px 0 ${theme.glassInner}`,
          overflow: "hidden",
        }}>
          <div
            key={fadeTick}
            style={{ maxHeight: "100%", overflowY: "auto", scrollbarWidth: "none", padding: 24, display: "flex", flexDirection: "column", animation: panelAnim }}
          >

            {/* ═══ ESTADO HOY ═══ */}
            {!selected && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, flexShrink: 0 }}>
                  <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 20, color: theme.cardInk }}>
                    Hoy
                  </div>
                  <div style={{ fontSize: 12, color: "#9FB4C6" }}>
                    {new Date().toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                  </div>
                </div>

                {/* Tarjeta de estado del check-in */}
                {todayCheckIn && (() => {
                  const energy = todayCheckIn.energy ?? 3;
                  const LABELS: Record<number, { label: string; msg: string; grad: string }> = {
                    1: { label: "Poca energía",  msg: "Un día para ir suave y con calma.", grad: "radial-gradient(circle at 38% 32%,#C6BEE2 0%,#7A6EA0 100%)" },
                    2: { label: "Algo cansado",  msg: "Misiones suaves para hoy.",         grad: "radial-gradient(circle at 38% 32%,#C6C8E0 0%,#7A8AB0 100%)" },
                    3: { label: "Energía media", msg: "Buen momento para avanzar.",        grad: "radial-gradient(circle at 38% 32%,#CBE6E0 0%,#6E9A94 100%)" },
                    4: { label: "Con energía",   msg: "¡Tienes energía! Aprovéchala.",     grad: "radial-gradient(circle at 38% 32%,#CBE6C2 0%,#7E9A86 100%)" },
                    5: { label: "¡A tope!",      msg: "Al máximo. Prueba algo que te rete.", grad: "radial-gradient(circle at 38% 32%,#F0E8C2 0%,#C0A840 100%)" },
                  };
                  const lv = LABELS[Math.min(Math.max(energy, 1), 5)];
                  return (
                    <Link href="/checkin" style={{ display: "block", textDecoration: "none", margin: "12px 0 4px", background: "rgba(91,155,209,.1)", border: "1px solid rgba(146,199,230,.28)", borderRadius: 16, padding: 14, cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 12, background: lv.grad, boxShadow: "inset 0 1px 4px rgba(255,255,255,.4)" }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 15, color: "#ECE6D8" }}>{lv.label}</div>
                          <div style={{ fontSize: 12, color: "#9FB4C6" }}>Registrado hoy · toca para editar</div>
                        </div>
                        <div style={{ flexShrink: 0, display: "flex", gap: 3, alignItems: "flex-end", height: 18 }}>
                          {[8, 13, 18, 11].map((h, i) => (
                            <div key={i} style={{ width: 4, height: h, background: i === 2 ? "#E3A878" : i < 2 ? "#7E9A86" : "#5C665E", borderRadius: 2 }} />
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: 12.5, color: "#A7B2AE", fontStyle: "italic", marginTop: 11 }}>{lv.msg}</div>
                    </Link>
                  );
                })()}

                {/* Sin check-in: mensaje + botón */}
                {!todayCheckIn && (
                  <>
                    <div style={{ fontSize: 13.5, color: theme.cardSub, fontStyle: "italic", marginBottom: 16, lineHeight: 1.6 }}>
                      Registra cómo llegás hoy para ver qué misiones se adaptan mejor a tu momento.
                    </div>
                    <Link href="/checkin" style={{ display: "block", textAlign: "center", fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 14, color: "#FBF8F1", background: "#2A332D", borderRadius: 999, padding: "12px", textDecoration: "none" }}>
                      Hacer check-in →
                    </Link>
                  </>
                )}

                {/* Tu semana */}
                <div style={{ margin: "18px 0 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#7FA8C4", fontWeight: 600 }}>Tu semana</span>
                  <span style={{ fontSize: 12, color: theme.cardSub }}>{weekDays.filter((d) => d.done).length}/7 días</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                  {weekDays.map((d, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: d.done ? "#7E9A86" : "transparent",
                        border: d.isToday ? "2px solid #E3A878" : (d.done ? "2px solid #7E9A86" : "2px solid rgba(236,230,216,.18)"),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: d.done ? "#16202A" : "transparent", fontSize: 12, fontWeight: 600,
                      }}>
                        {d.done ? "✓" : ""}
                      </div>
                      <span style={{ fontSize: 10.5, color: d.isToday ? "#E3A878" : "#93A0A0" }}>{d.label}</span>
                    </div>
                  ))}
                </div>

                {/* Recomendaciones */}
                {todayCheckIn && recommendations && recommendations.recommendations.length > 0 && (
                  <>
                    <div style={{ fontSize: 13.5, color: theme.cardSub, fontStyle: "italic", marginBottom: 14, lineHeight: 1.5 }}>{recommendations.message}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: theme.cardSub, marginBottom: 12 }}>Recomendado para hoy</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {recommendations.recommendations.slice(0, 3).map((rec) => (
                        <div key={rec.id} style={{ display: "flex", gap: 11, alignItems: "flex-start", background: theme.trackBg, border: glassBorder, borderRadius: 13, padding: "13px 14px" }}>
                          <span style={{ color: "#E3A878", marginTop: 1, flexShrink: 0 }}>✦</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14.5, color: theme.cardInk }}>{rec.title}</div>
                            <div style={{ fontSize: 12, color: theme.cardSub, marginTop: 2 }}>{rec.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {todayCheckIn && recommendations && recommendations.recommendations.length === 0 && (
                  <div style={{ fontSize: 13, color: theme.cardSub, lineHeight: 1.5, marginBottom: 14 }}>
                    {recommendations.message}
                  </div>
                )}

                <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(236,230,216,.1)" }}>
                  <NewAdventurePanel fullWidth onCreated={refresh} />
                </div>
              </>
            )}

            {/* ═══ ESTADO MISIONES ═══ */}
            {selected && (
              <>
                {/* Back + kebab */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexShrink: 0 }}>
                  <button onClick={goBack} style={{ fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 13, color: theme.cardSub, background: theme.trackBg, border: glassBorder, borderRadius: 999, padding: "7px 14px", cursor: "pointer" }}>
                    ‹ Hoy
                  </button>
                  <button
                    onClick={() => setShowAdvModal(true)}
                    style={{ background: "none", border: "none", width: 30, height: 30, borderRadius: "50%", color: theme.cardSub, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    ⋮
                  </button>
                </div>

                {/* Adventure title + badge */}
                <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: theme.cardSub, fontWeight: 600, flexShrink: 0 }}>Aventura</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4, marginBottom: 16, flexShrink: 0 }}>
                      <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 21, color: theme.cardInk, lineHeight: 1.2, maxWidth: 220 }}>
                        {selected.title}
                      </div>
                      <div style={{ flexShrink: 0, fontSize: 12.5, color: "#9FB4C6", background: "rgba(91,155,209,.16)", border: "1px solid rgba(146,199,230,.35)", padding: "5px 11px", borderRadius: 999, marginLeft: 8, marginTop: 2, whiteSpace: "nowrap" }}>
                        {selected.missions.filter((m) => m.completed).length} de {selected.missions.length} misiones
                      </div>
                    </div>
                    {selected.missions.length > 0 && (
                      <div style={{ marginBottom: 20, flexShrink: 0, height: 8, borderRadius: 999, background: theme.trackBg }}>
                        <div style={{ height: 8, borderRadius: 999, transition: "width .3s ease", width: `${Math.round((selected.missions.filter((m) => m.completed).length / selected.missions.length) * 100)}%`, background: "linear-gradient(90deg,#7E9A86,#5B9BD1)" }} />
                      </div>
                    )}

                {/* Lista de misiones */}
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {selected.missions.map((m) => {
                      const lv = MISSION_LEVELS[Math.min(Math.max(m.difficulty - 1, 0), 2)];
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: "flex", gap: 13, alignItems: "center",
                            background: m.completed ? "rgba(126,154,134,.1)" : theme.trackBg,
                            border: glassBorder, borderRadius: 13,
                            padding: "12px 13px 12px 15px",
                            transition: "background .2s ease",
                          }}
                        >
                          {/* Toggle button */}
                          <button
                            onClick={async () => {
                              await fetch(`/api/mobile/missions/${m.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ completed: !m.completed }),
                              });
                              refresh();
                            }}
                            style={{
                              width: 23, height: 23, borderRadius: "50%",
                              border: m.completed ? "2px solid #7E9A86" : "2px solid #5B9BD1",
                              background: m.completed ? "#7E9A86" : "transparent",
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#FBF8F1", fontSize: 13, transition: "all .2s ease", flexShrink: 0,
                            }}>
                              {m.completed ? "✓" : ""}
                            </button>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14.5, color: m.completed ? theme.cardSub : theme.cardInk, textDecoration: m.completed ? "line-through" : "none" }}>
                              {m.title}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 5 }}>
                              <div style={{
                                display: "flex", alignItems: "center", gap: 6,
                                background: `rgba(${hexToRgb(lv.color)},.12)`,
                                border: `1px solid rgba(${hexToRgb(lv.color)},.32)`,
                                borderRadius: 999, padding: "3px 9px",
                              }}>
                                <div style={{ display: "flex", gap: 3 }}>
                                  {[1, 2, 3].map((d) => (
                                    <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: d <= lv.value ? lv.color : DIM }} />
                                  ))}
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: lv.color }}>{lv.label}</span>
                              </div>
                              <span style={{ fontSize: 12, color: "#93A0A0" }}>+{lv.xp} XP</span>
                            </div>
                          </div>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditorTarget({ adventureId: selected.id, mission: m }); }}
                            style={{
                              flexShrink: 0, width: 30, height: 30, borderRadius: 9,
                              background: "rgba(236,230,216,.06)", border: "1px solid rgba(236,230,216,.14)",
                              color: "#9FB4C6", fontSize: 13, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            ✎
                          </button>
                        </div>
                      );
                    })}

                    {/* Agregar misión */}
                    <div
                      onClick={() => setEditorTarget({ adventureId: selected.id, mission: null })}
                      style={{
                        display: "flex", gap: 13, alignItems: "center",
                        background: "rgba(236,230,216,.03)", border: `1px dashed ${theme.glassBorder}`,
                        borderRadius: 13, padding: "13px 15px", color: theme.cardSub, cursor: "pointer",
                      }}
                    >
                      <div style={{ flexShrink: 0, width: 23, height: 23, borderRadius: "50%", border: `2px dashed ${theme.cardSub}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>+</div>
                      <div style={{ fontWeight: 600, fontSize: 14.5 }}>Agregar misión</div>
                    </div>
                  </div>

                {/* CTA */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(236,230,216,.1)" }}>
                    <button
                      onClick={async () => {
                        const next = selected.missions.find((m) => !m.completed);
                        if (!next) return;
                        await fetch(`/api/mobile/missions/${next.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ completed: true }),
                        });
                        refresh();
                      }}
                      disabled={!selected.missions.find((m) => !m.completed)}
                      style={{
                        width: "100%", fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 15,
                        color: "#1E282A", background: "#E3A878",
                        border: "none", borderRadius: 14, padding: "15px",
                        cursor: "pointer", boxShadow: "0 10px 26px rgba(227,168,120,.28)",
                        opacity: selected.missions.find((m) => !m.completed) ? 1 : 0.4,
                      }}
                    >
                      Completar misión de hoy
                    </button>
                </div>

                {/* Adventure editor modal */}
                {showAdvModal && (
                  <AdventureEditorModal
                    adventure={selected}
                    onClose={() => setShowAdvModal(false)}
                    onSaved={refresh}
                    onDeleted={() => { setShowAdvModal(false); setSelectedId(null); setFadeTick(t => t + 1); refresh(); }}
                  />
                )}
              </>
            )}

          </div>
        </div>

      </div>

      </div>{/* /nav rail + content flex row */}

      {/* Bottom nav — mobile */}
      <div className="av-bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(10,15,26,.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(236,230,216,.1)",
        padding: "10px 0 16px",
        justifyContent: "space-around", alignItems: "center",
        zIndex: 60,
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#CDE6F5" }}>
          <span style={{ fontSize: 22 }}>⛰</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Aventuras</span>
        </Link>
        <Link href="/checkin" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#9FB4C6", position: "relative" }}>
          <span style={{ fontSize: 22 }}>♡</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Check-in</span>
          {!todayCheckIn && (
            <span style={{ position: "absolute", top: -1, right: -4, width: 8, height: 8, borderRadius: "50%", background: "#7E9A86", border: "2px solid rgba(10,15,26,.9)" }} />
          )}
        </Link>
        <Link href="/progress" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#9FB4C6" }}>
          <span style={{ fontSize: 22 }}>◷</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Progreso</span>
        </Link>
      </div>

      {/* Mission editor modal */}
      {editorTarget && (
        <MissionEditorModal
          adventureId={editorTarget.adventureId}
          mission={editorTarget.mission}
          onClose={() => setEditorTarget(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
