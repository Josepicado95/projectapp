import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMoment } from "@/lib/theme";
import ThreeBackground from "@/components/background/ThreeBackground";
import NewMissionForm from "@/components/NewMissionForm";
import MissionList from "@/components/MissionList";

export default async function AdventureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const adventureId = Number(id);
  if (isNaN(adventureId)) notFound();

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    include: { missions: { orderBy: { createdAt: "asc" } } },
  });
  if (!adventure) notFound();

  const completedCount = adventure.missions.filter((m) => m.completed).length;
  const pct = adventure.missions.length === 0
    ? 0
    : Math.round((completedCount / adventure.missions.length) * 100);

  const reqHeaders = await headers();
  const tz = reqHeaders.get("x-vercel-ip-timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()),
    10,
  );
  const theme = getMoment(localHour);

  return (
    <div style={{ position: "relative", height: "100vh", overflow: "hidden", fontFamily: "var(--font-hanken), sans-serif" }}>
      <ThreeBackground moment={theme.key} />

      <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 1 }}>

        {/* Nav rail */}
        <nav className="av-nav-rail" style={{
          flexShrink: 0, width: 84,
          background: "rgba(10,15,26,.66)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(236,230,216,.1)",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "22px 0",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "radial-gradient(circle at 60% 35%, #F0EAD8, #9DB6A4)",
            boxShadow: "0 0 18px rgba(240,234,216,.3)",
            marginBottom: 24, flexShrink: 0,
          }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            {[
              { icon: "⛰", label: "Aventuras", href: "/",         active: true  },
              { icon: "♡", label: "Check-in",  href: "/checkin",  active: false },
              { icon: "◷", label: "Progreso",  href: "/progress", active: false },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 15,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 4,
                  ...(item.active
                    ? { background: "rgba(91,155,209,.2)", border: "1px solid rgba(146,199,230,.45)", color: "#CDE6F5" }
                    : { color: "#9FB4C6" }),
                }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 600 }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* Scrollable content */}
        <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "28px 28px 64px" }}>

          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "#7A8FA0", textDecoration: "none", marginBottom: 22,
          }}>
            ← Volver al dashboard
          </Link>

          {/* Adventure header */}
          <div style={{
            background: "rgba(14,20,36,.82)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(236,230,216,.14)",
            borderRadius: 24,
            padding: "28px 28px 22px",
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
              <h1 style={{
                fontFamily: "var(--font-schibsted)",
                fontWeight: 700, fontSize: 22, color: "#F2EFE6", lineHeight: 1.25, margin: 0,
              }}>
                {adventure.title}
              </h1>
              <span style={{
                flexShrink: 0,
                background: "rgba(126,154,134,.12)",
                border: "1px solid rgba(126,154,134,.3)",
                borderRadius: 12,
                padding: "5px 13px",
                fontSize: 13, fontWeight: 700, color: "#7E9A86",
              }}>
                {pct}%
              </span>
            </div>

            {adventure.description && (
              <p style={{ fontSize: 14, color: "#7A8FA0", lineHeight: 1.55, marginBottom: 16 }}>
                {adventure.description}
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 5, borderRadius: 5, background: "rgba(236,230,216,.1)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 5,
                  background: "linear-gradient(90deg,#7E9A8699,#7E9A86)",
                  width: `${pct}%`,
                  transition: "width .5s cubic-bezier(.2,0,0,1)",
                }} />
              </div>
              <span style={{ flexShrink: 0, fontSize: 12, color: "#5A6A78" }}>
                {completedCount} / {adventure.missions.length} misiones
              </span>
            </div>
          </div>

          {/* Missions */}
          <div style={{
            background: "rgba(14,20,36,.78)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(236,230,216,.12)",
            borderRadius: 20,
            padding: "22px 24px",
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: ".09em",
              textTransform: "uppercase", color: "#4E6070", marginBottom: 18,
            }}>
              Misiones
            </p>
            <NewMissionForm adventureId={adventure.id} />
            <MissionList missions={adventure.missions} />
          </div>

        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="av-bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(10,15,26,.88)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(236,230,216,.1)",
        padding: "10px 0 16px",
        justifyContent: "space-around", alignItems: "center",
        zIndex: 60,
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#CDE6F5" }}>
          <span style={{ fontSize: 22 }}>⛰</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Aventuras</span>
        </Link>
        <Link href="/checkin" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#9FB4C6" }}>
          <span style={{ fontSize: 22 }}>♡</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Check-in</span>
        </Link>
        <Link href="/progress" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#9FB4C6" }}>
          <span style={{ fontSize: 22 }}>◷</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Progreso</span>
        </Link>
      </div>
    </div>
  );
}
