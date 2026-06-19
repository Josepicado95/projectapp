"use client";

import { ResponsiveLine } from "@nivo/line";

type CheckInPoint = {
  date: string;
  energy: number;
  mood: number;
  stress: number;
  sleep: number;
};

const SERIES = [
  { key: "energy", label: "Energía", color: "#22c55e" },
  { key: "mood",   label: "Ánimo",   color: "#3b82f6" },
  { key: "stress", label: "Estrés",  color: "#ef4444" },
  { key: "sleep",  label: "Sueño",   color: "#a855f7" },
] as const;

export default function CheckInChart({ data }: { data: CheckInPoint[] }) {
  const nivoData = SERIES.map(({ key, label, color }) => ({
    id: label,
    color,
    data: data.map((point) => ({ x: point.date, y: point[key] })),
  }));

  return (
    <div style={{ height: 320 }}>
      <ResponsiveLine
        data={nivoData}
        margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 1, max: 5 }}
        axisBottom={{ tickRotation: -45, tickSize: 0 }}
        axisLeft={{ tickValues: [1, 2, 3, 4, 5], tickSize: 0 }}
        colors={{ datum: "color" }}
        lineWidth={2}
        pointSize={5}
        pointBorderWidth={1}
        pointBorderColor={{ from: "color" }}
        useMesh={true}
        enableGridX={false}
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            translateY: 56,
            itemWidth: 70,
            itemHeight: 20,
            symbolSize: 10,
            symbolShape: "circle",
          },
        ]}
      />
    </div>
  );
}
