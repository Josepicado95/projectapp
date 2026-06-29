"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";

function DustParticles() {
  const count = 120;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy  = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const ph  = new Float32Array(count);
    const scl = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = -1 + Math.random() * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
      spd[i] = 0.1 + Math.random() * 0.25;
      ph[i]  = Math.random() * Math.PI * 2;
      scl[i] = 0.015 + Math.random() * 0.01;
    }
    return { pos, spd, ph, scl };
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        data.pos[i * 3]     + Math.sin(t * data.spd[i] + data.ph[i]) * 0.6,
        data.pos[i * 3 + 1] + t * data.spd[i] * 0.18 % 7,
        data.pos[i * 3 + 2]
      );
      dummy.scale.setScalar(data.scl[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#FFD080" transparent opacity={0.55} />
    </instancedMesh>
  );
}

function Pine({ x, z, h }: { x: number; z: number; h: number }) {
  return (
    <group position={[x, -3, z]}>
      <mesh position={[0, h * 0.55, 0]}>
        <coneGeometry args={[h * 0.35, h, 7]} />
        <meshStandardMaterial color="#0D2218" roughness={1} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.45, 6]} />
        <meshStandardMaterial color="#1A1008" roughness={1} />
      </mesh>
    </group>
  );
}

export default function MorningScene() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.y = 1.5 + Math.sin(t * 0.15) * 0.25;
    camera.position.x = Math.sin(t * 0.07) * 1.2;
  });

  return (
    <>
      <fog attach="fog" args={["#FFD8A8", 20, 120]} />
      <ambientLight intensity={0.5} color="#FFD8A8" />
      <directionalLight position={[8, 4, -10]} intensity={1.6} color="#FFA850" castShadow />

      <Sky
        distance={450000}
        sunPosition={[0.2, 0.08, -1]}
        inclination={0.52}
        azimuth={0.25}
        turbidity={6}
        rayleigh={3}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Reflective lake */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -3, -8]}>
        <planeGeometry args={[40, 20]} />
        <MeshReflectorMaterial
          blur={[200, 100]}
          resolution={256}
          mixBlur={0.9}
          mixStrength={28}
          roughness={0.9}
          depthScale={1}
          minDepthThreshold={0.2}
          maxDepthThreshold={1.2}
          color="#88AACC"
          metalness={0.4}
          mirror={0.6}
        />
      </mesh>

      {/* Ground */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -3.05, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#2A4028" roughness={1} />
      </mesh>

      {/* Background mountains */}
      <mesh position={[-20, 2, -70]}>
        <coneGeometry args={[18, 28, 5]} />
        <meshStandardMaterial color="#A0B8B0" roughness={1} />
      </mesh>
      <mesh position={[16, 0, -80]}>
        <coneGeometry args={[22, 32, 5]} />
        <meshStandardMaterial color="#90A8A0" roughness={1} />
      </mesh>

      {/* Pine trees */}
      <Pine x={-9} z={-4} h={4} />
      <Pine x={-7} z={-2} h={3} />
      <Pine x={10} z={-5} h={5} />
      <Pine x={12} z={-3} h={3.5} />
      <Pine x={-14} z={-6} h={6} />

      <DustParticles />
    </>
  );
}
