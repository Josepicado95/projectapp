"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Cloud } from "@react-three/drei";
import * as THREE from "three";

function Hills() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(120, 60, 48, 24);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, Math.sin(x * 0.08) * 3 + Math.sin(z * 0.12 + x * 0.04) * 2 + Math.sin(x * 0.22) * 1);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -4, -15]} geometry={geometry}>
      <meshStandardMaterial color="#4A8038" roughness={0.95} />
    </mesh>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.6) * 0.018;
  });
  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.35, 2.5, 8]} />
        <meshStandardMaterial color="#3D1F0A" roughness={1} />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <sphereGeometry args={[2.6, 12, 12]} />
        <meshStandardMaterial color="#2E6620" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.8, 0]}>
        <sphereGeometry args={[1.8, 10, 10]} />
        <meshStandardMaterial color="#387828" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Butterflies() {
  const count = 30;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy  = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph  = new Float32Array(count);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = 0.5 + Math.random() * 4;
      pos[i * 3 + 2] = -2 + (Math.random() - 0.5) * 10;
      ph[i]  = Math.random() * Math.PI * 2;
      spd[i] = 0.5 + Math.random() * 1.2;
    }
    return { pos, ph, spd };
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        data.pos[i * 3]     + Math.sin(t * data.spd[i] * 0.4 + data.ph[i]) * 3,
        data.pos[i * 3 + 1] + Math.sin(t * data.spd[i] + data.ph[i]) * 0.5,
        data.pos[i * 3 + 2] + Math.cos(t * data.spd[i] * 0.3 + data.ph[i]) * 2
      );
      dummy.scale.setScalar(0.06);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#FFE060" transparent opacity={0.7} />
    </instancedMesh>
  );
}

export default function AfternoonScene() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.y = 2.5 + Math.sin(t * 0.12) * 0.2;
    camera.position.x = Math.sin(t * 0.05) * 2;
  });

  return (
    <>
      <color attach="background" args={["#87CEEB"]} />
      <fog attach="fog" args={["#C8E8F8", 60, 180]} />
      <ambientLight intensity={0.7} color="#FFF8E8" />
      <directionalLight position={[5, 12, -8]} intensity={2} color="#FFFAE8" castShadow />

      <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0}
        azimuth={0.25}
        turbidity={4}
        rayleigh={1.5}
        mieCoefficient={0.003}
        mieDirectionalG={0.8}
      />

      {/* Clouds */}
      <Cloud position={[-8, 5, -25]}  speed={0.12} opacity={0.65} segments={8} />
      <Cloud position={[6,  7, -35]}  speed={0.08} opacity={0.5}  segments={6} />
      <Cloud position={[18, 4, -20]}  speed={0.15} opacity={0.55} segments={7} />
      <Cloud position={[-18, 6, -30]} speed={0.1}  opacity={0.48} segments={5} />

      <Hills />

      {/* Ground */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -4, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#5A9042" roughness={1} />
      </mesh>

      <Tree position={[-7, -4, -5]} />
      <Tree position={[9,  -4, -8]} />

      <Butterflies />
    </>
  );
}
