import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewMissionForm from "@/components/NewMissionForm";
import MissionList from "@/components/MissionList";

export default async function AdventureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adventureId = Number(id);

  if (isNaN(adventureId)) notFound();

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    include: {
      missions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!adventure) notFound();

  const completedCount = adventure.missions.filter((m) => m.completed).length;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href="/" className="text-indigo-500 text-sm mb-4 inline-block">
        ← Volver al Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{adventure.title}</h1>
        {adventure.description && (
          <p className="text-gray-600 mt-1">{adventure.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">Estado: {adventure.status}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-3">
          Misiones ({completedCount}/{adventure.missions.length} completadas)
        </h2>
        <NewMissionForm adventureId={adventure.id} />
        <MissionList missions={adventure.missions} />
      </div>
    </main>
  );
}
