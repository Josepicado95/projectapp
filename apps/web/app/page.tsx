import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/auth";
import DashboardBody from "@/components/DashboardBody";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/actions/auth";
import { getRecommendations } from "@/lib/recommender";
import { getMoment } from "@/lib/theme";
import ThreeBackground from "@/components/background/ThreeBackground";

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
    <div style={{ height: "100vh", overflow: "hidden", position: "relative" }}>

      {/* 3D cinematic background */}
      <ThreeBackground moment={theme.key} />

      {/* Content layer */}
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

        {/* Dashboard body */}
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
      </div>

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

    </div>
  );
}
