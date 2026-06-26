"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { MomentKey } from "@/lib/theme";
import type { WeatherCondition } from "@/lib/weather";
import NightScene from "./scenes/NightScene";
import MorningScene from "./scenes/MorningScene";
import AfternoonScene from "./scenes/AfternoonScene";

// Remaining scenes imported here as they are built (Task 8)

type Props = {
  moment: MomentKey;
  weather?: WeatherCondition;
};

function SceneSelector({ moment }: { moment: MomentKey }) {
  switch (moment) {
    case "noche":     return <NightScene />;
    case "manana":    return <MorningScene />;
    case "tarde":     return <AfternoonScene />;
    case "atardecer": return <NightScene />; // placeholder until Task 8
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
      </Suspense>
    </Canvas>
  );
}
