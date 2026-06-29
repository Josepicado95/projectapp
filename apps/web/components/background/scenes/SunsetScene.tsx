"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";

function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(120, 80, 40, 40), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const pos = (meshRef.current.geometry as THREE.PlaneGeometry)
      .attributes.position as THREE.BufferAttribute;
    const t = clock.getElapsedTime();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i,
        Math.sin(x * 0.22 + t * 0.9) * 0.45 +
        Math.sin(z * 0.35 + t * 0.7) * 0.3 +
        Math.sin(x * 0.08 + z * 0.12 + t * 0.5) * 0.25
      );
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} position={[0, -2.5, -10]} geometry={geometry}>
      <meshStandardMaterial color="#1A3A5A" roughness={0.06} metalness={0.88} />
    </mesh>
  );
}

function Rocks() {
  const configs: [number, number, number, number, number, number][] = [
    [-6, -3.5, 0,  1.2, 2.0, 1.0],
    [-4, -3.8, 2,  0.8, 1.4, 0.9],
    [5,  -3.5, 1,  1.5, 2.4, 1.1],
    [7,  -3.7, -1, 0.9, 1.6, 0.8],
    [-10,-3.4, -2, 1.8, 2.8, 1.3],
  ];
  return (
    <>
      {configs.map(([x, y, z, rx, ry, rz], i) => (
        <mesh key={i} position={[x, y, z]} scale={[rx, ry, rz]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#1A1410" roughness={1} />
        </mesh>
      ))}
    </>
  );
}

function Seagulls() {
  const count = 18;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy  = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph  = new Float32Array(count);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = 2 + Math.random() * 6;
      pos[i * 3 + 2] = -8 + (Math.random() - 0.5) * 20;
      ph[i]  = Math.random() * Math.PI * 2;
      spd[i] = 0.2 + Math.random() * 0.5;
    }
    return { pos, ph, spd };
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        data.pos[i * 3]     + t * data.spd[i] * 1.5 % 40 - 20,
        data.pos[i * 3 + 1] + Math.sin(t * data.spd[i] * 2 + data.ph[i]) * 0.5,
        data.pos[i * 3 + 2]
      );
      dummy.scale.setScalar(0.12);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <coneGeometry args={[1, 0.4, 3]} />
      <meshBasicMaterial color="#2A1810" transparent opacity={0.6} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

export default function SunsetScene() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.y = 1.8 + Math.sin(t * 0.14) * 0.22;
    camera.position.x = Math.sin(t * 0.06) * 1.8;
  });

  return (
    <>
      <fog attach="fog" args={["#FF8040", 60, 200]} />
      <ambientLight intensity={0.35} color="#FF6020" />
      <directionalLight position={[0, 1, -20]} intensity={2.4} color="#FF8030" />
      <hemisphereLight args={["#FF9060", "#1A1020", 0.5]} />

      <Sky
        distance={450000}
        sunPosition={[0, 0.05, -1]}
        inclination={0.49}
        azimuth={0.5}
        turbidity={10}
        rayleigh={4}
        mieCoefficient={0.01}
        mieDirectionalG={0.85}
      />

      <Ocean />
      <Rocks />
      <Seagulls />

      {/* Cliff ground */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -3.6, 5]}>
        <planeGeometry args={[60, 30]} />
        <meshStandardMaterial color="#1A1008" roughness={1} />
      </mesh>
    </>
  );
}
