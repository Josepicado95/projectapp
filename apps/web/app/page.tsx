import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/auth";
import DashboardBody from "@/components/DashboardBody";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/actions/auth";
import { getRecommendations } from "@/lib/recommender";
import { getMoment } from "@/lib/theme";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);

  const adventures = await prisma.adventure.findMany({
    where: { userId },
    include: { missions: { orderBy: { id: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  const todayCheckIn = await prisma.checkIn.findFirst({
    where: { userId, date: { gte: startOfDay, lte: endOfDay } },
  });

  const recentCheckIns = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 30,
    select: { date: true },
  });

  // Racha: días consecutivos con check-in contando hacia atrás desde hoy (UTC)
  const ciDays = new Set(
    recentCheckIns.map((ci) => {
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
      continue; // hoy todavía no hay check-in, la racha sigue viva
    } else {
      break;
    }
  }

  const activeAdventures = adventures.filter((a) => a.status !== "completed");
  const totalMissions = activeAdventures.reduce((sum, a) => sum + a.missions.length, 0);
  const doneMissions = activeAdventures.reduce(
    (sum, a) => sum + a.missions.filter((m) => m.completed).length,
    0
  );

  // Últimos 7 días para los puntos de "Tu semana"
  const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"] as const; // 0=Dom
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (6 - i)); // i=0 → hace 6 días, i=6 → hoy
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    return { done: ciDays.has(key), label: DAY_LABELS[d.getUTCDay()], isToday: i === 6 };
  });

  const pendingMissions = adventures.flatMap((a) =>
    a.missions
      .filter((m) => !m.completed)
      .map((m) => ({
        id: m.id,
        title: m.title,
        difficulty: m.difficulty,
        completed: m.completed,
      }))
  );

  const recommendations = todayCheckIn
    ? await getRecommendations(todayCheckIn, pendingMissions)
    : null;

  const firstName = session.user.name?.split(" ")[0] ?? session.user.name;
  const initial = (session.user.name?.[0] ?? "?").toUpperCase();

  // Use Vercel's IP-timezone header when deployed; fall back to server's local timezone in dev
  const reqHeaders = await headers();
  const tz = reqHeaders.get("x-vercel-ip-timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()),
    10
  );
  const theme = getMoment(localHour);

  return (
    <div style={{ height: "100vh", overflow: "hidden" }}>
      <div style={{
        position: "relative",
        height: "100%",
        background: theme.skyGradient,
        overflow: "hidden",
      }}>

        {/* ── Elementos decorativos ── */}
        <div style={{ position: "absolute", inset: 0, opacity: theme.starOpacity, pointerEvents: "none", transition: "opacity 1s" }}>
          {[
            { left: "14%", top: "12%", size: 2, delay: "0s" },
            { left: "28%", top: "8%",  size: 2, delay: "1.5s" },
            { left: "44%", top: "16%", size: 2, delay: ".8s" },
            { left: "62%", top: "9%",  size: 3, delay: "2s" },
            { left: "74%", top: "20%", size: 2, delay: ".3s" },
            { left: "88%", top: "13%", size: 2, delay: "1.2s" },
            { left: "54%", top: "25%", size: 2, delay: ".6s" },
          ].map((s, i) => (
            <div key={i} style={{
              position: "absolute", left: s.left, top: s.top,
              width: s.size, height: s.size, borderRadius: "50%",
              background: "#F3ECDF",
              animation: `av-twinkle ${3.8 + i * 0.4}s ease-in-out infinite`,
              animationDelay: s.delay,
            }} />
          ))}
        </div>

        <div style={{
          position: "absolute", right: theme.sunRight, top: theme.sunTop,
          width: 160, height: 160, borderRadius: "50%",
          background: theme.sunGlow, animation: "av-glow 8s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 230, height: 120,
          background: theme.hazeBand, filter: "blur(28px)", pointerEvents: "none",
        }} />

        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 300,
          background: theme.hillFar,
          clipPath: "polygon(0 58%,16% 40%,34% 52%,52% 33%,72% 48%,88% 36%,100% 44%,100% 100%,0 100%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 300,
          background: theme.hillFar, opacity: .5, filter: "blur(2px)",
          clipPath: "polygon(0 64%,22% 48%,40% 58%,60% 42%,80% 54%,100% 46%,100% 100%,0 100%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 210,
          background: theme.hillNear,
          clipPath: "polygon(0 62%,24% 46%,48% 60%,70% 42%,100% 56%,100% 100%,0 100%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 210,
          background: `linear-gradient(180deg, ${theme.hillSheen} 0%, rgba(255,255,255,0) 38%)`,
          clipPath: "polygon(0 62%,24% 46%,48% 60%,70% 42%,100% 56%,100% 100%,0 100%)",
          pointerEvents: "none",
        }} />

        {/* ── Capa de contenido: nav rail + dashboard ── */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex",
        }}>

          {/* ── Nav Rail (desktop) ── */}
          <div className="av-nav-rail" style={{
            flexShrink: 0, width: 84,
            background: "rgba(10,15,26,.66)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRight: "1px solid rgba(236,230,216,.1)",
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "22px 0",
          }}>
            {/* Logo */}
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: "radial-gradient(circle at 60% 35%, #F0EAD8, #9DB6A4)",
              boxShadow: "0 0 18px rgba(240,234,216,.3)",
              marginBottom: 24, flexShrink: 0,
            }} />

            {/* Nav items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              {/* Aventuras — active */}
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

              {/* Check-in */}
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

              {/* Progreso */}
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

            {/* Avatar / logout */}
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

          {/* ── Dashboard body ── */}
          <DashboardBody
            adventures={adventures}
            todayCheckIn={todayCheckIn}
            recommendations={recommendations}
            theme={theme}
            firstName={firstName ?? ""}
            streak={streak}
            doneMissions={doneMissions}
            totalMissions={totalMissions}
            weekDays={weekDays}
          />

          {/* ── Orbe-asistente IA (placeholder tappable) ── */}
          <div
            title="Asistente (próximamente)"
            style={{
              position: "absolute",
              left: "55%", bottom: 104,
              transform: "translateX(-50%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 13,
              cursor: "pointer", zIndex: 6, pointerEvents: "auto",
            }}
          >
            {/* Speech bubble */}
            <div style={{
              background: "rgba(20,28,33,.6)",
              backdropFilter: "blur(14px) saturate(1.2)",
              WebkitBackdropFilter: "blur(14px) saturate(1.2)",
              border: "1px solid rgba(236,230,216,.18)",
              borderRadius: "18px 18px 18px 5px",
              padding: "12px 16px",
              boxShadow: "0 12px 30px rgba(0,0,0,.32)",
              maxWidth: 220,
              fontSize: 13.5, color: "#ECE6D8", lineHeight: 1.45,
            }}>
              ¿Cómo te sientes hoy? Estoy aquí para acompañarte en el camino.
            </div>
            {/* Orbe */}
            <div style={{
              position: "relative",
              width: 66, height: 66, borderRadius: "50%",
              background: "radial-gradient(circle at 38% 32%, #DCEEFA 0%, #5B9BD1 58%, #3E6E8C 100%)",
              boxShadow: "0 0 34px rgba(91,155,209,.5), inset 0 2px 7px rgba(255,255,255,.45)",
              animation: "av-glow 6s ease-in-out infinite",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 25, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.2))" }}>✦</span>
              <span style={{
                position: "absolute", bottom: 4, right: 6,
                width: 13, height: 13, borderRadius: "50%",
                background: "#7E9A86", border: "2.5px solid #16202A",
              }} />
            </div>
          </div>

        </div>

        {/* ── Barra inferior móvil ── */}
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

      </div>
    </div>
  );
}
