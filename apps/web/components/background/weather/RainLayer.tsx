"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function RainLayer() {
  const count = 2000;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy  = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = Math.random() * 30 - 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      data[i * 3 + 1] -= delta * 18;
      if (data[i * 3 + 1] < -5) data[i * 3 + 1] = 25;
      dummy.position.set(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
      dummy.scale.set(0.015, 0.25, 0.015);
      dummy.rotation.z = 0.26; // 15° tilt
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {/* Dark cloud plane */}
      <mesh position={[0, 18, -20]}>
        <planeGeometry args={[120, 40]} />
        <meshBasicMaterial color="#1A1E28" transparent opacity={0.55} />
      </mesh>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[1, 1, 1, 4]} />
        <meshBasicMaterial color="#8AAABB" transparent opacity={0.35} />
      </instancedMesh>
    </>
  );
}
