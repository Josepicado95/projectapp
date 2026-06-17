import AdventureCard from "@/components/AdventureCard";
import NewAdventureForm from "@/components/NewAdventureForm";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const adventures = await prisma.adventure.findMany({
    include: { missions: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main>
      <h1>Mis Aventuras</h1>
      <NewAdventureForm />
      {adventures.length === 0 ? (
        <p>No tienes aventuras todavía.</p>
      ) : (
        adventures.map((adventure) => (
          <AdventureCard key={adventure.id} adventure={adventure} />
        ))
      )}
    </main>
  );
}
