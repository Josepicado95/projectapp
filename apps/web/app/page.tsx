import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import AdventureCard from "@/components/AdventureCard";
import NewAdventureForm from "@/components/NewAdventureForm";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/actions/auth";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);

  const adventures = await prisma.adventure.findMany({
    where: { userId },
    include: { missions: true },
    orderBy: { createdAt: "desc" },
  });

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
