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

  return (
    <main className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mis Aventuras</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Hola, {session.user.name}</span>
          <form action={logoutAction}>
            <button type="submit" className="text-sm border px-3 py-1 rounded">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      <div className="mb-4">
        <Link
          href="/checkin"
          className="text-sm bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded"
        >
          Check-in de hoy →
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Recomendado para hoy</h2>
        {!todayCheckIn ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-700">
            Haz tu{" "}
            <Link href="/checkin" className="underline">
              check-in de hoy
            </Link>{" "}
            para ver misiones recomendadas.
          </div>
        ) : !recommendations ? (
          <div className="bg-gray-50 border rounded p-3 text-sm text-gray-500">
            Las recomendaciones no están disponibles en este momento.
          </div>
        ) : recommendations.recommendations.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
            {recommendations.message}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 italic">{recommendations.message}</p>
            {recommendations.recommendations.map((rec) => (
              <div key={rec.id} className="bg-green-50 border border-green-200 rounded p-3">
                <p className="font-medium text-sm">{rec.title}</p>
                <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewAdventureForm />

      {adventures.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No tienes aventuras todavía.</p>
      ) : (
        adventures.map((adventure) => (
          <AdventureCard key={adventure.id} adventure={adventure} />
        ))
      )}
    </main>
  );
}
