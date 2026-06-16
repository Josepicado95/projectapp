import Image from "next/image";
import AdventureCard from "@/components/AdventureCard";
import { adventures } from "@/lib/mock-data";

export default function Home() {
  return (
    <main>
      <h1>Learning how to chambiar</h1>
      {adventures.map((adventure) => (
        <AdventureCard key={adventure.id} adventure={adventure} />
      ))}
    </main>
  );
}