import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import AdventureCard from "@/components/AdventureCard";
import NewAdventureForm from "@/components/NewAdventureForm";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/actions/auth";
import { getRecommendations } from "@/lib/recommender";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);

  const adventures = await prisma.adventure.findMany({
    where: { userId },
    include: { missions: true },
    orderBy: { createdAt: "desc" },
  });

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  const todayCheckIn = await prisma.checkIn.findFirst({
    where: { userId, date: { gte: startOfDay, lte: endOfDay } },
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

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-slate-400 mb-0.5">Bienvenido de vuelta</p>
          <h1 className="text-2xl font-bold text-slate-800">{firstName} ✦</h1>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      {/* Nav pills */}
      <div className="flex gap-2 mb-8">
        <Link
          href="/checkin"
          className="flex items-center gap-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-full font-medium transition-colors"
        >
          <span>☀️</span> Check-in de hoy
        </Link>
        <Link
          href="/progress"
          className="flex items-center gap-1.5 text-sm bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 px-4 py-2 rounded-full font-medium transition-colors"
        >
          <span>📈</span> Mi progreso
        </Link>
      </div>

      {/* Recomendaciones */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Recomendado para hoy
        </h2>

        {!todayCheckIn ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
            Haz tu{" "}
            <Link href="/checkin" className="font-semibold underline underline-offset-2">
              check-in de hoy
            </Link>{" "}
            para ver qué misiones te vienen mejor ahora mismo.
          </div>
        ) : !recommendations ? (
          <div className="bg-slate-100 rounded-2xl p-4 text-sm text-slate-500">
            Las recomendaciones no están disponibles en este momento.
          </div>
        ) : recommendations.recommendations.length === 0 ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-sm text-indigo-700">
            {recommendations.message}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-400 italic mb-3">{recommendations.message}</p>
            {recommendations.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-start gap-3"
              >
                <span className="text-rose-400 text-lg mt-0.5">✦</span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{rec.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Aventuras */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Mis aventuras
        </h2>

        <NewAdventureForm />

        {adventures.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-3xl mb-2">🗺️</p>
            <p className="text-sm">Todavía no tienes aventuras.</p>
            <p className="text-sm">¡Crea la primera arriba!</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {adventures.map((adventure) => (
              <AdventureCard key={adventure.id} adventure={adventure} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
