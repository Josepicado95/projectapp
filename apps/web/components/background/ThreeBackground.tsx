"use client";

import dynamic from "next/dynamic";
import type { MomentKey } from "@/lib/theme";

const SkyCanvas = dynamic(() => import("./SkyCanvas"), { ssr: false });

type Props = {
  moment: MomentKey;
  isStatic?: boolean;
};

export default function ThreeBackground({ moment, isStatic }: Props) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <SkyCanvas moment={moment} isStatic={isStatic} />
    </div>
  );
}
