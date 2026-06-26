import dynamic from "next/dynamic";
import type { MomentKey } from "@/lib/theme";
import type { WeatherCondition } from "@/lib/weather";

const ThreeCanvas = dynamic(() => import("./ThreeCanvas"), { ssr: false });

type Props = {
  moment: MomentKey;
  weather?: WeatherCondition;
};

export default function ThreeBackground({ moment, weather }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <ThreeCanvas moment={moment} weather={weather} />
    </div>
  );
}
