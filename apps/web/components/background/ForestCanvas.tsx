"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import ForestScene from "./scenes/ForestScene";

export default function ForestCanvas({ isStatic = false }: { isStatic?: boolean }) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ fov: 62, near: 0.1, far: 500, position: [0, 0.8, 14] }}
      gl={{ alpha: false, antialias: true }}
    >
      <Suspense fallback={null}>
        <ForestScene isStatic={isStatic} />
      </Suspense>
    </Canvas>
  );
}
