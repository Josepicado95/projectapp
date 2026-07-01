"use client";

import { useRef, useEffect } from "react";
import type { MomentKey } from "@/lib/theme";
import type { SkyMomentKey } from "@/lib/sky-engine";

const MOMENT_MAP: Record<MomentKey, SkyMomentKey> = {
  manana:    "dawn",
  tarde:     "noon",
  atardecer: "dusk",
  noche:     "night",
};

type Props = {
  moment: MomentKey;
  isStatic?: boolean;
};

export default function SkyCanvas({ moment, isStatic }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const engineRef  = useRef<{ setMoment(k: SkyMomentKey): void; destroy(): void } | null>(null);
  const momentRef  = useRef(moment);

  // Sync moment changes without recreating the engine
  useEffect(() => {
    momentRef.current = moment;
    engineRef.current?.setMoment(MOMENT_MAP[moment]);
  }, [moment]);

  // Init engine once; clean up on unmount
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let destroyed = false;
    import("@/lib/sky-engine").then(({ SkyEngine }) => {
      if (destroyed) return;
      engineRef.current = SkyEngine.init(canvas, {
        moment: MOMENT_MAP[momentRef.current],
        static: isStatic,
      });
    });
    return () => {
      destroyed = true;
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  // isStatic intentionally excluded — it's a creation-time option, not reactive
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
