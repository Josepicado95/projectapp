import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CheckInChart from "@/components/CheckInChart";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);

  const adventures = await prisma.adventure.findMany({
    where: { userId },
    include: { missions: true },
    orderBy: { createdAt: "desc" },
  });

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const checkIns = await prisma.checkIn.findMany({
    where: { userId, date: { gte: fourteenDaysAgo } },
    orderBy: { date: "asc" },
    select: { date: true, energy: true, mood: true, stress: true, sleep: true },
  });

  const chartData = checkIns.map((c) => ({
    date: c.date.toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
    energy: c.energy,
    mood: c.mood,
    stress: c.stress,
    sleep: c.sleep,
  }));

  return (
    <main className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Mi Progreso</h1>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Aventuras</h2>
        {adventures.length === 0 ? (
          <p className="text-gray-400 text-sm">No tienes aventuras todavía.</p>
        ) : (
          <div className="space-y-4">
            {adventures.map((a) => {
              const total = a.missions.length;
              const completed = a.missions.filter((m) => m.completed).length;
              const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
              return (
                <div key={a.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{a.title}</span>
                    <span className="text-gray-500">
                      {completed}/{total} misiones · {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Estado de ánimo — últimos 14 días</h2>
        {checkIns.length === 0 ? (
          <p className="text-gray-400 text-sm">Aún no hay check-ins registrados.</p>
        ) : (
          <CheckInChart data={chartData} />
        )}
      </section>
    </main>
  );
}
