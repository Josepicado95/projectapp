"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { MomentKey } from "@/lib/theme";
import type { WeatherCondition } from "@/lib/weather";
import ForestScene from "./scenes/ForestScene";
import MorningScene from "./scenes/MorningScene";
import AfternoonScene from "./scenes/AfternoonScene";
import SunsetScene from "./scenes/SunsetScene";
import RainLayer from "./weather/RainLayer";
import SnowLayer from "./weather/SnowLayer";

type Props = {
  moment: MomentKey;
  weather?: WeatherCondition;
  isStatic?: boolean;
};

function WeatherLayer({ weather }: { weather?: WeatherCondition }) {
  if (!weather || weather === "clear") return null;
  if (weather === "rain" || weather === "storm") return <RainLayer />;
  if (weather === "snow") return <SnowLayer />;
  return null;
}

function SceneSelector({ moment, isStatic }: { moment: MomentKey; isStatic?: boolean }) {
  switch (moment) {
    case "noche":     return <ForestScene isStatic={isStatic} />;
    case "manana":    return <MorningScene />;
    case "tarde":     return <AfternoonScene />;
    case "atardecer": return <SunsetScene />;
  }
}

export default function ThreeCanvas({ moment, weather, isStatic }: Props) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ fov: 60, near: 0.1, far: 500, position: [0, 2, 10] }}
      gl={{ alpha: false, antialias: true }}
    >
      <Suspense fallback={null}>
        <SceneSelector moment={moment} isStatic={isStatic} />
        <WeatherLayer weather={weather} />
      </Suspense>
    </Canvas>
  );
}
