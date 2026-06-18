import { CheckIn } from "@/lib/generated/prisma/client";

type Props = {
  checkIns: CheckIn[];
};

function ValueBadge({ value }: { value: number }) {
  const color =
    value >= 4 ? "bg-green-100 text-green-700" :
    value === 3 ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${color}`}>
      {value}
    </span>
  );
}

export default function CheckInHistory({ checkIns }: Props) {
  if (checkIns.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-4">
        Aún no hay check-ins registrados.
      </p>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Últimos 7 días</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left border-b">
              <th className="pb-2 pr-4 font-medium">Fecha</th>
              <th className="pb-2 px-2 font-medium">Energía</th>
              <th className="pb-2 px-2 font-medium">Ánimo</th>
              <th className="pb-2 px-2 font-medium">Estrés</th>
              <th className="pb-2 px-2 font-medium">Sueño</th>
            </tr>
          </thead>
          <tbody>
            {checkIns.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-2 pr-4 text-gray-600">
                  {new Date(c.date).toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </td>
                <td className="py-2 px-2"><ValueBadge value={c.energy} /></td>
                <td className="py-2 px-2"><ValueBadge value={c.mood} /></td>
                <td className="py-2 px-2"><ValueBadge value={c.stress} /></td>
                <td className="py-2 px-2"><ValueBadge value={c.sleep} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
