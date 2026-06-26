"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function SnowLayer() {
  const count = 1500;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy  = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph  = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = Math.random() * 30 - 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      ph[i]  = Math.random() * Math.PI * 2;
    }
    return { pos, ph };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      data.pos[i * 3 + 1] -= delta * 1.8;
      if (data.pos[i * 3 + 1] < -5) data.pos[i * 3 + 1] = 25;
      dummy.position.set(
        data.pos[i * 3] + Math.sin(t * 0.4 + data.ph[i]) * 0.4,
        data.pos[i * 3 + 1],
        data.pos[i * 3 + 2]
      );
      dummy.scale.setScalar(0.04 + Math.sin(data.ph[i]) * 0.02);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#EEF4FF" transparent opacity={0.55} />
    </instancedMesh>
  );
}
