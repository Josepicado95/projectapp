"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { MomentKey } from "@/lib/theme";
import type { WeatherCondition } from "@/lib/weather";
import NightScene from "./scenes/NightScene";
import MorningScene from "./scenes/MorningScene";
import AfternoonScene from "./scenes/AfternoonScene";
import SunsetScene from "./scenes/SunsetScene";
import RainLayer from "./weather/RainLayer";
import SnowLayer from "./weather/SnowLayer";

type Props = {
  moment: MomentKey;
  weather?: WeatherCondition;
};

function WeatherLayer({ weather }: { weather?: WeatherCondition }) {
  if (!weather || weather === "clear") return null;
  if (weather === "rain" || weather === "storm") return <RainLayer />;
  if (weather === "snow") return <SnowLayer />;
  return null; // fog handled via scene fog; storm = rain at higher intensity
}

function SceneSelector({ moment }: { moment: MomentKey }) {
  switch (moment) {
    case "noche":     return <NightScene />;
    case "manana":    return <MorningScene />;
    case "tarde":     return <AfternoonScene />;
    case "atardecer": return <SunsetScene />;
  }
}

export default function ThreeCanvas({ moment, weather }: Props) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ fov: 60, near: 0.1, far: 500, position: [0, 2, 10] }}
      gl={{ alpha: false, antialias: true }}
    >
      <Suspense fallback={null}>
        <SceneSelector moment={moment} />
        <WeatherLayer weather={weather} />
      </Suspense>
    </Canvas>
  );
}
