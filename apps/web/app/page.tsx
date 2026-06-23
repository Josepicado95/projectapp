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

        {/* ── Paisaje cinematográfico (parallax multi-capa) ── */}

        {/* Aurora ribbons */}
        <div style={{ position: "absolute", left: "-10%", right: "-10%", top: "8%", height: 200, background: "linear-gradient(180deg,rgba(126,154,134,0) 0%,rgba(126,154,134,.22) 45%,rgba(126,154,134,0) 100%)", filter: "blur(34px)", transformOrigin: "center top", animation: "av-aurora 22s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: "-10%", right: "-10%", top: "2%", height: 160, background: "linear-gradient(180deg,rgba(91,155,209,0) 0%,rgba(91,155,209,.2) 50%,rgba(91,155,209,0) 100%)", filter: "blur(40px)", transformOrigin: "center top", animation: "av-aurora 30s ease-in-out infinite reverse", pointerEvents: "none" }} />

        {/* Stars + shooting star */}
        <div style={{ position: "absolute", inset: 0, opacity: theme.starOpacity, transition: "opacity 1.1s ease", pointerEvents: "none" }}>
          <div style={{ position: "absolute", inset: 0, animation: "av-driftBack 60s ease-in-out infinite alternate", pointerEvents: "none" }}>
            {([
              { l:"8%",  t:"13%", sz:2, dur:4.5, d:0,    glow:true },
              { l:"16%", t:"9%",  sz:2, dur:5.5, d:.4,   glow:false },
              { l:"24%", t:"22%", sz:2, dur:4,   d:1.1,  glow:false },
              { l:"30%", t:"6%",  sz:3, dur:6,   d:.8,   glow:true },
              { l:"38%", t:"15%", sz:2, dur:5,   d:1.6,  glow:false },
              { l:"46%", t:"8%",  sz:2, dur:4.8, d:.2,   glow:false },
              { l:"64%", t:"11%", sz:2, dur:5.2, d:1.3,  glow:false },
              { l:"72%", t:"19%", sz:3, dur:6.4, d:.6,   glow:true },
              { l:"84%", t:"10%", sz:2, dur:4.6, d:1.9,  glow:false },
              { l:"91%", t:"24%", sz:2, dur:5.6, d:.9,   glow:false },
              { l:"55%", t:"5%",  sz:2, dur:5,   d:1.4,  glow:false },
              { l:"12%", t:"30%", sz:2, dur:6,   d:.3,   glow:false },
              { l:"88%", t:"34%", sz:2, dur:4.4, d:1.7,  glow:false },
            ] as const).map((s, i) => (
              <div key={i} style={{ position: "absolute", left: s.l, top: s.t, width: s.sz, height: s.sz, borderRadius: "50%", background: "#F3ECDF", boxShadow: s.glow ? "0 0 4px rgba(243,236,223,.8)" : undefined, animation: `av-twinkle ${s.dur}s ease-in-out infinite ${s.d}s` }} />
            ))}
          </div>
          {/* Shooting star */}
          <div style={{ position: "absolute", left: "18%", top: "8%", width: 90, height: 2, borderRadius: 2, background: "linear-gradient(90deg,rgba(243,236,223,0) 0%,rgba(243,236,223,.95) 100%)", filter: "drop-shadow(0 0 4px rgba(243,236,223,.7))", animation: "av-shoot 11s ease-in infinite", pointerEvents: "none" }} />
        </div>

        {/* Moon / sun crossing the sky */}
        <div style={{ position: "absolute", left: "53%", top: 84, width: 150, height: 150, animation: "av-cross 60s ease-in-out infinite alternate" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: theme.sunGlow, transition: "background 1s ease", animation: "av-glow 8s ease-in-out infinite" }} />
        </div>
        {/* Soft reflected glow below celestial body */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 150, width: 360, height: 90, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(240,234,216,.14) 0%,rgba(240,234,216,0) 70%)", filter: "blur(8px)", pointerEvents: "none" }} />

        {/* Atmospheric clouds drifting */}
        <div style={{ position: "absolute", left: 0, right: 0, top: "18%", animation: "av-drift 46s ease-in-out infinite alternate", pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: "30%", width: 260, height: 48, borderRadius: "50%", background: "rgba(245,240,228,.16)", filter: "blur(22px)" }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: "32%", animation: "av-driftBack 58s ease-in-out infinite alternate", pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: "56%", width: 320, height: 56, borderRadius: "50%", background: "rgba(245,240,228,.12)", filter: "blur(26px)" }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: "47%", animation: "av-drift 64s ease-in-out infinite alternate", pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: "40%", width: 210, height: 40, borderRadius: "50%", background: "rgba(245,240,228,.10)", filter: "blur(22px)" }} />
        </div>

        {/* Sea at horizon */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, height: 32, background: theme.parallaxSea, opacity: .62, transition: "background 1s ease", pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 10, left: 0, width: "55%", height: 2, background: "linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.55),rgba(255,255,255,0))", animation: "av-drift 24s ease-in-out infinite alternate" }} />
          <div style={{ position: "absolute", top: 20, left: "30%", width: "45%", height: 1, background: "linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.4),rgba(255,255,255,0))", animation: "av-driftBack 30s ease-in-out infinite alternate" }} />
        </div>

        {/* Far range mountains — slowest pan */}
        <div style={{ position: "absolute", left: 0, bottom: 118, width: "200%", height: 200, display: "flex", animation: "av-pan 120s linear infinite", opacity: .6, filter: "blur(1px)", pointerEvents: "none" }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ flexShrink: 0, width: "50%", height: "100%", background: theme.parallaxL1, transition: "background 1s ease", clipPath: "polygon(0 76%,6% 56%,12% 70%,19% 40%,26% 62%,33% 34%,41% 60%,48% 46%,56% 66%,63% 42%,71% 64%,79% 36%,87% 60%,94% 48%,100% 76%,100% 100%,0 100%)" }} />
          ))}
        </div>

        {/* City + mountain scenery by the sea */}
        <div style={{ position: "absolute", left: 0, bottom: 96, width: "200%", height: 150, display: "flex", animation: "av-pan 96s linear infinite", opacity: .92, pointerEvents: "none" }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ flexShrink: 0, width: "50%", height: "100%", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: theme.parallaxScenery, transition: "background 1s ease", clipPath: "polygon(0 82%,8% 82%,16% 16%,24% 82%,33% 82%,38% 82%,38% 54%,42% 54%,42% 82%,46% 82%,46% 40%,50% 40%,50% 82%,54% 82%,54% 60%,58% 60%,58% 82%,61% 82%,61% 33%,65% 33%,65% 82%,68% 82%,68% 56%,72% 56%,72% 82%,82% 70%,90% 78%,100% 82%,100% 100%,0 100%)" }} />
              {/* Window lights visible at night */}
              {([{l:"47%",b:42},{l:"48.5%",b:30},{l:"62.5%",b:58},{l:"69.5%",b:36}] as const).map((d, j) => (
                <div key={j} style={{ position: "absolute", left: d.l, bottom: d.b, width: 3, height: 3, borderRadius: "50%", background: "#FFDFA6", opacity: theme.starOpacity }} />
              ))}
            </div>
          ))}
        </div>

        {/* Mid hills */}
        <div style={{ position: "absolute", left: 0, bottom: 54, width: "200%", height: 210, display: "flex", animation: "av-pan 78s linear infinite", pointerEvents: "none" }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ flexShrink: 0, width: "50%", height: "100%", background: theme.parallaxL2, transition: "background 1s ease", clipPath: "polygon(0 70%,10% 52%,20% 64%,30% 44%,42% 62%,52% 48%,64% 66%,74% 50%,86% 64%,94% 54%,100% 70%,100% 100%,0 100%)" }} />
          ))}
        </div>

        {/* Near ridge */}
        <div style={{ position: "absolute", left: 0, bottom: 0, width: "200%", height: 180, display: "flex", animation: "av-pan 50s linear infinite", pointerEvents: "none" }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ flexShrink: 0, width: "50%", height: "100%", background: theme.parallaxL3, transition: "background 1s ease", clipPath: "polygon(0 58%,8% 44%,16% 56%,26% 34%,36% 52%,46% 30%,56% 50%,66% 32%,76% 52%,86% 36%,94% 50%,100% 58%,100% 100%,0 100%)" }} />
          ))}
        </div>

        {/* Trees + mirador props */}
        <div style={{ position: "absolute", left: 0, bottom: 0, width: "200%", height: 120, display: "flex", animation: "av-pan 44s linear infinite", pointerEvents: "none" }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ flexShrink: 0, width: "50%", height: "100%", position: "relative" }}>
              {/* Round tree 1 */}
              <div style={{ position: "absolute", left: "13%", bottom: 0, width: 40, height: 56, transformOrigin: "bottom center", animation: "av-sway 4.2s ease-in-out infinite" }}>
                <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 0, width: 5, height: 24, background: theme.parallaxL4 }} />
                <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 16, width: 34, height: 34, borderRadius: "50%", background: theme.parallaxL4 }} />
              </div>
              {/* Pine 1 */}
              <div style={{ position: "absolute", left: "27%", bottom: 0, width: 30, height: 54, transformOrigin: "bottom center", animation: "av-sway 5s ease-in-out infinite .6s" }}>
                <div style={{ position: "absolute", inset: 0, background: theme.parallaxL4, clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
              </div>
              {/* Round tree 2 */}
              <div style={{ position: "absolute", left: "39%", bottom: 0, width: 32, height: 46, transformOrigin: "bottom center", animation: "av-sway 4.6s ease-in-out infinite 1.1s" }}>
                <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 0, width: 4, height: 20, background: theme.parallaxL4 }} />
                <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 13, width: 28, height: 28, borderRadius: "50%", background: theme.parallaxL4 }} />
              </div>
              {/* Mirador */}
              <div style={{ position: "absolute", left: "71%", bottom: 0, width: 96, height: 50 }}>
                <div style={{ position: "absolute", left: 0, bottom: 0, width: 96, height: 9, background: theme.parallaxL4 }} />
                <div style={{ position: "absolute", left: 6, bottom: 9, width: 3, height: 22, background: theme.parallaxL4 }} />
                <div style={{ position: "absolute", left: 46, bottom: 9, width: 3, height: 22, background: theme.parallaxL4 }} />
                <div style={{ position: "absolute", left: 87, bottom: 9, width: 3, height: 22, background: theme.parallaxL4 }} />
                <div style={{ position: "absolute", left: 4, bottom: 29, width: 86, height: 3, background: theme.parallaxL4 }} />
                <div style={{ position: "absolute", left: 62, bottom: 9, width: 8, height: 18, borderRadius: "4px 4px 0 0", background: theme.parallaxL4 }} />
                <div style={{ position: "absolute", left: 63, bottom: 25, width: 6, height: 6, borderRadius: "50%", background: theme.parallaxL4 }} />
              </div>
              {/* Pine 2 */}
              <div style={{ position: "absolute", left: "92%", bottom: 0, width: 26, height: 46, transformOrigin: "bottom center", animation: "av-sway 5.4s ease-in-out infinite .3s" }}>
                <div style={{ position: "absolute", inset: 0, background: theme.parallaxL4, clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Foreground pines — fastest pan for depth */}
        <div style={{ position: "absolute", left: 0, bottom: 0, width: "200%", height: 120, display: "flex", animation: "av-pan 38s linear infinite", pointerEvents: "none" }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ flexShrink: 0, width: "50%", height: "100%", background: theme.parallaxL4, transition: "background 1s ease", clipPath: "polygon(0 100%,4% 60%,8% 100%,15% 48%,22% 100%,31% 66%,40% 100%,52% 54%,63% 100%,74% 62%,85% 100%,93% 70%,100% 100%)" }} />
          ))}
        </div>

        {/* Wind gusts */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {([{top:"30%",w:56,dur:8,d:0},{top:"43%",w:40,dur:6.5,d:2.4},{top:"24%",w:66,dur:9.5,d:4.8},{top:"53%",w:46,dur:7.4,d:3.5}] as const).map((g, i) => (
            <div key={i} style={{ position: "absolute", top: g.top, left: 0, width: g.w, height: 2, borderRadius: 2, background: "linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.45))", animation: `av-wind ${g.dur}s linear infinite ${g.d}s` }} />
          ))}
        </div>

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
            {/* Orbe — bobs suavemente */}
            <div style={{ position: "relative", animation: "av-bob 5s ease-in-out infinite" }}>
              <span style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "1.5px solid rgba(146,199,230,.5)", animation: "av-ring 3.2s ease-out infinite", pointerEvents: "none" }} />
              <div style={{
                position: "relative", width: 66, height: 66, borderRadius: "50%",
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
