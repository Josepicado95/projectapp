import { Mission } from "@/lib/generated/prisma/client";
import MissionItem from "@/components/MissionItem";

type Props = {
  missions: Mission[];
};

export default function MissionList({ missions }: Props) {
  if (missions.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-4 text-center">
        Aún no hay misiones — ¡agrega la primera arriba!
      </p>
    );
  }

  const pending = missions.filter((m) => !m.completed);
  const completed = missions.filter((m) => m.completed);

  return (
    <div>
      {pending.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Pendientes ({pending.length})
          </h3>
          {pending.map((mission) => (
            <MissionItem key={mission.id} mission={mission} />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Completadas ({completed.length})
          </h3>
          {completed.map((mission) => (
            <MissionItem key={mission.id} mission={mission} />
          ))}
        </div>
      )}
    </div>
  );
}
