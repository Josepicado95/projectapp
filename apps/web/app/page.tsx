import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import AdventureCard from "@/components/AdventureCard";
import NewAdventurePanel from "@/components/NewAdventurePanel";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/actions/auth";
import { getRecommendations } from "@/lib/recommender";

function timeGreeting(hour: number) {
  if (hour < 12) return { greeting: "Buenos días", sub: "Hoy puede ser un buen día. Un paso a la vez." };
  if (hour < 19) return { greeting: "Buenas tardes", sub: "Vas hacia algo bueno. Hoy basta con un paso." };
  return { greeting: "Buenas noches", sub: "Llegaste hasta aquí. Mañana seguimos el camino." };
}

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

  const pendingMissions = activeAdventures.flatMap((a) =>
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
  const { greeting, sub } = timeGreeting(new Date().getHours());

  return (
    /* Outer shell — fija el viewport, sin scroll en body */
    <div style={{ height: "100vh", overflow: "hidden" }}>

      {/* ══════════════════════════════════════════
          ESCENA DEL PAISAJE — altura fija = 100vh
      ══════════════════════════════════════════ */}
      <div style={{
        position: "relative",
        height: "100%",
        background: "linear-gradient(180deg,#F3ECDF 0%,#E7E7DC 28%,#C9DCE3 58%,#AFC3B4 100%)",
        overflow: "hidden",
      }}>

        {/* ── Elementos decorativos (siempre detrás del contenido) ── */}

        {/* Sol */}
        <div style={{
          position: "absolute",
          right: "13%", top: "9%",
          width: 150, height: 150, borderRadius: "50%",
          background: "radial-gradient(circle,#F6E2C6 0%,#F0C9A8 55%,rgba(240,201,168,0) 72%)",
          animation: "av-glow 7s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Nube 1 */}
        <div style={{
          position: "absolute",
          left: -40, top: "19%",
          width: 360, height: 60, borderRadius: "50%",
          background: "rgba(251,248,241,.55)",
          filter: "blur(18px)",
          animation: "av-drift 26s ease-in-out infinite alternate",
          pointerEvents: "none",
        }} />

        {/* Nube 2 */}
        <div style={{
          position: "absolute",
          right: 80, top: "36%",
          width: 300, height: 48, borderRadius: "50%",
          background: "rgba(251,248,241,.42)",
          filter: "blur(16px)",
          animation: "av-drift 32s ease-in-out infinite alternate-reverse",
          pointerEvents: "none",
        }} />

        {/* Colinas lejanas */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 300,
          background: "#9DB6A4",
          clipPath: "polygon(0 55%,18% 38%,38% 50%,60% 30%,80% 46%,100% 34%,100% 100%,0 100%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 210,
          background: "#7E9A86",
          clipPath: "polygon(0 60%,22% 44%,46% 58%,68% 40%,100% 56%,100% 100%,0 100%)",
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", maxWidth: 720 }}>
              <div>
                <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 28, color: "#2A332D", lineHeight: 1.1 }}>
                  {greeting}, {firstName}
                </div>
                <div style={{ fontSize: 15, color: "#48564B", marginTop: 6 }}>{sub}</div>
              </div>

              {/* Pill derecha: estado check-in + avatar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(251,248,241,.72)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,.6)",
                borderRadius: 999, padding: "9px 9px 9px 16px",
              }}>
                <Link
                  href="/checkin"
                  style={{
                    fontSize: 13, color: "#48564B", fontWeight: 500,
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
                      background: "#2A332D", color: "#FBF8F1",
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

          {/* ── Zona scrollable: aventuras + recomendaciones ── */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 44px 20px",
            scrollbarWidth: "none",
          }}>
            {/* Grid de aventuras: 1 columna en mobile, 2 en desktop (lg = 1024px+) */}
            <div
              className="grid grid-cols-1 lg:grid-cols-2 items-start"
              style={{ maxWidth: 760, gap: 22, marginBottom: 22 }}
            >
              {activeAdventures.length === 0 ? (
                <div className="lg:col-span-2" style={{
                  background: "rgba(251,248,241,.84)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,.55)",
                  borderRadius: 18, padding: "24px 22px",
                  color: "#5C665E", fontSize: 15,
                }}>
                  Todavía no tienes aventuras activas. Crea la primera con el botón de abajo.
                </div>
              ) : (
                activeAdventures.map((adventure, i) => (
                  <AdventureCard key={adventure.id} adventure={adventure} index={i} />
                ))
              )}
            </div>

            {/* Recomendaciones y banners: siempre 1 columna, ancho completo */}
            <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>

              {recommendations && recommendations.recommendations.length > 0 && (
                <div style={{
                  background: "rgba(227,168,120,.16)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(227,168,120,.28)",
                  borderRadius: 18, padding: "16px 20px",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#8A8D85", marginBottom: 8 }}>
                    Recomendado para hoy
                  </div>
                  <div style={{ fontSize: 13, color: "#5C665E", marginBottom: 10, fontStyle: "italic" }}>
                    {recommendations.message}
                  </div>
                  {recommendations.recommendations.slice(0, 3).map((rec) => (
                    <div key={rec.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                      <span style={{ color: "#E3A878", marginTop: 1, flexShrink: 0 }}>✦</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#2A332D" }}>{rec.title}</div>
                        <div style={{ fontSize: 12, color: "#8A8D85" }}>{rec.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!todayCheckIn && (
                <div style={{
                  background: "rgba(146,183,204,.18)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(146,183,204,.3)",
                  borderRadius: 18, padding: "14px 20px",
                  fontSize: 14, color: "#48564B",
                }}>
                  Haz tu{" "}
                  <Link href="/checkin" style={{ color: "#7E9A86", fontWeight: 600, textDecoration: "none" }}>
                    check-in de hoy
                  </Link>{" "}
                  para ver qué misiones te vienen mejor ahora mismo.
                </div>
              )}

              {todayCheckIn && !recommendations && (
                <div style={{
                  background: "rgba(251,248,241,.6)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,.4)",
                  borderRadius: 18, padding: "14px 20px",
                  fontSize: 13, color: "#8A8D85",
                }}>
                  Check-in registrado ✓ — Las recomendaciones no están disponibles en este momento.
                </div>
              )}
            </div>{/* /recomendaciones */}
          </div>{/* /scrollable */}

          {/* ── Botones inferiores (no crecen, siempre visibles) ── */}
          <div style={{ flexShrink: 0, padding: "12px 44px 30px", display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              href="/progress"
              style={{
                fontFamily: "var(--font-hanken)", fontWeight: 500, fontSize: 14,
                color: "#2A332D",
                background: "rgba(251,248,241,.72)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,.55)",
                borderRadius: 999, padding: "11px 20px",
                textDecoration: "none",
              }}
            >
              Mi progreso
            </Link>
            <NewAdventurePanel />
          </div>

        </div>{/* /capa contenido */}
      </div>{/* /escena */}
    </div>
  );
}
