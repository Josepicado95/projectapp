"use client";

import dynamic from "next/dynamic";

const SkyCanvas = dynamic(() => import("./background/SkyCanvas"), { ssr: false });

export default function ForestBackground({ static: isStatic = false }: { static?: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <SkyCanvas moment="noche" isStatic={isStatic} />
    </div>
  );
}
