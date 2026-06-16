import { Adventure } from "@/types";

type AdventureCardProps = {
  adventure: Adventure;
};

export default function AdventureCard({ adventure }: AdventureCardProps) {
  return (
    <div>
    <h2>{adventure.title}</h2>
    <p>{adventure.description}</p>
    <p>Misiones activas: {adventure.missions.length}</p>
    </div>
  );
}