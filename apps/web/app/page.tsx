import { redirect } from "next/navigation";
import Link from "next/link";
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

  const activeAdventures = adventures.filter((a) => a.status !== "completed");

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
  const theme = getMoment(new Date().getHours());

  return (
    /* Outer shell — fija el viewport, sin scroll en body */
    <div style={{ height: "100vh", overflow: "hidden" }}>

      {/* ══════════════════════════════════════════
          ESCENA DEL PAISAJE — altura fija = 100vh
      ══════════════════════════════════════════ */}
      <div style={{
        position: "relative",
        height: "100%",
        background: theme.skyGradient,
        overflow: "hidden",
      }}>

        {/* ── Elementos decorativos (siempre detrás del contenido) ── */}

        {/* Estrellas — solo visibles de noche */}
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

        {/* Sol / Luna */}
        <div style={{
          position: "absolute",
          right: theme.sunRight, top: theme.sunTop,
          width: 160, height: 160, borderRadius: "50%",
          background: theme.sunGlow,
          animation: "av-glow 8s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Haze sobre el horizonte */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 230, height: 120,
          background: theme.hazeBand,
          filter: "blur(28px)",
          pointerEvents: "none",
        }} />

        {/* Colinas — 3 capas para dar profundidad */}
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
        {/* Sheen (brillo en la cima de la colina cercana) */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 210,
          background: `linear-gradient(180deg, ${theme.hillSheen} 0%, rgba(255,255,255,0) 38%)`,
          clipPath: "polygon(0 62%,24% 46%,48% 60%,70% 42%,100% 56%,100% 100%,0 100%)",
          pointerEvents: "none",
        }} />

        {/* ══════════════════════════════════════════
            CAPA DE CONTENIDO — flex column, ocupa todo
        ══════════════════════════════════════════ */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
        }}>

          {/* ── Encabezado (no crece, altura fija) ── */}
          <div style={{ flexShrink: 0, padding: "36px 44px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 28, color: theme.headerInk, lineHeight: 1.1 }}>
                  {theme.greeting}, {firstName}
                </div>
                <div style={{ fontSize: 15, color: theme.headerSub, marginTop: 6 }}>{theme.subtext}</div>
              </div>

              {/* Pill derecha: estado check-in + avatar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: theme.glassBg,
                backdropFilter: "blur(14px) saturate(1.1)",
                WebkitBackdropFilter: "blur(14px) saturate(1.1)",
                border: `1px solid ${theme.glassBorder}`,
                borderRadius: 999, padding: "9px 9px 9px 16px",
                boxShadow: `0 8px 24px ${theme.glassShadow}, inset 0 1px 0 ${theme.glassInner}`,
              }}>
                <Link
                  href="/checkin"
                  style={{
                    fontSize: 13, color: theme.cardInk, fontWeight: 500,
                    textDecoration: "none", whiteSpace: "nowrap",
                  }}
                >
                  {todayCheckIn ? "✓ Check-in hecho" : "Check-in de hoy →"}
                </Link>
                <form action={logoutAction} style={{ margin: 0 }}>
                  <button
                    type="submit"
                    title="Cerrar sesión"
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
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
          </div>

          {/* ── Cuerpo: delega todo al componente cliente ── */}
          <DashboardBody
            adventures={adventures}
            todayCheckIn={todayCheckIn}
            recommendations={recommendations}
            theme={theme}
          />

        </div>{/* /capa contenido */}
      </div>{/* /escena */}
    </div>
  );
}
