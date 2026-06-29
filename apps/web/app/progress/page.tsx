import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/actions/auth";
import ProgressBody from "@/components/ProgressBody";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);

  const [adventures, checkIns, recentCheckIns] = await Promise.all([
    prisma.adventure.findMany({
      where: { userId },
      include: { missions: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.checkIn.findMany({
      where: { userId, date: { gte: new Date(Date.now() - 14 * 86400_000) } },
      orderBy: { date: "asc" },
      select: { date: true, energy: true, mood: true, stress: true, sleep: true },
    }),
    prisma.checkIn.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 60,
      select: { date: true },
    }),
  ]);

  // Streak calculation
  const ciDays = new Set(
    recentCheckIns.map(ci => {
      const d = new Date(ci.date);
      return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    })
  );
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    if (ciDays.has(key)) { streak++; }
    else if (i === 0) { continue; }
    else { break; }
  }

  return (
    <>
      <ProgressBody
        adventures={adventures.map(a => ({
          id: a.id,
          title: a.title,
          missions: a.missions.map(m => ({ id: m.id, label: m.title, completed: m.completed })),
        }))}
        checkIns={checkIns.map(ci => ({
          date: new Date(ci.date).toISOString().slice(0, 10),
          energy: ci.energy,
          mood: ci.mood,
          stress: ci.stress,
          sleep: ci.sleep,
        }))}
        userName={session.user.name ?? session.user.email ?? "?"}
        streak={streak}
        logoutAction={logoutAction}
      />

      {/* Mobile bottom nav (hidden on desktop via global CSS) */}
      <div className="av-bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(10,15,26,.88)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(236,230,216,.1)", padding: "10px 0 16px",
        justifyContent: "space-around", alignItems: "center", zIndex: 60 }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#9FB4C6" }}>
          <span style={{ fontSize: 22 }}>⛰</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Aventuras</span>
        </Link>
        <Link href="/checkin" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#9FB4C6" }}>
          <span style={{ fontSize: 22 }}>♡</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Check-in</span>
        </Link>
        <Link href="/progress" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#CDE6F5" }}>
          <span style={{ fontSize: 22 }}>◷</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Progreso</span>
        </Link>
      </div>
    </>
  );
}
