"use client";

import { Canvas } from "@react-three/fiber";
import type { MomentKey } from "@/lib/theme";
import type { WeatherCondition } from "@/lib/weather";

type Props = {
  moment: MomentKey;
  weather?: WeatherCondition;
};

export default function ThreeCanvas({ moment, weather }: Props) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ fov: 60, near: 0.1, far: 500, position: [0, 2, 10] }}
      gl={{ alpha: false, antialias: true }}
    >
      {/* Placeholder: solid dark sky while scenes are built */}
      <color attach="background" args={["#0E1630"]} />
      <ambientLight intensity={0.4} />
    </Canvas>
  );
}
