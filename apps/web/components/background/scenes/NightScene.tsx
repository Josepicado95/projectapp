"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

const AURORA_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AURORA_FRAG = `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float t = uTime * 0.28;
    vec2 uv = vUv;

    float w1 = sin(uv.x * 4.2 + t) * sin(uv.x * 1.6 - t * 0.65);
    float w2 = sin(uv.x * 6.5 - t * 1.05 + 2.1) * 0.55;
    float w3 = sin(uv.x * 2.8 + t * 0.4 + 1.0) * 0.35;
    float wave = w1 * 0.55 + w2 * 0.28 + w3 * 0.17;

    float mask = smoothstep(0.0, 0.28, uv.y) * smoothstep(1.0, 0.52, uv.y);
    float intensity = (wave * 0.5 + 0.5) * mask;

    vec3 green  = vec3(0.04, 0.88, 0.42);
    vec3 blue   = vec3(0.04, 0.42, 0.94);
    vec3 purple = vec3(0.52, 0.04, 0.84);

    float bf = sin(uv.x * 3.1 + t * 0.45) * 0.5 + 0.5;
    vec3 col = mix(green, blue, bf);
    col = mix(col, purple, sin(uv.x * 1.9 - t * 0.6) * 0.28 + 0.18);

    gl_FragColor = vec4(col * intensity, intensity * 0.72);
  }
`;

function Aurora() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh position={[0, 6, -45]} rotation-x={-0.15}>
      <planeGeometry args={[90, 24, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={AURORA_VERT}
        fragmentShader={AURORA_FRAG}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Moon() {
  return (
    <group position={[6, 7, -30]}>
      <mesh>
        <sphereGeometry args={[1.4, 20, 20]} />
        <meshStandardMaterial
          color="#F0EAD8"
          emissive="#F0EAD8"
          emissiveIntensity={0.25}
          roughness={0.9}
        />
      </mesh>
      <pointLight intensity={1.2} color="#E8E0C8" distance={180} decay={2} />
    </group>
  );
}

function Mountain({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
}) {
  return (
    <mesh position={position}>
      <coneGeometry args={[scale * 2.2, scale * 3.5, 5]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

function Fireflies() {
  const count = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { positions, speeds, phases } = useMemo(() => {
    const pos    = new Float32Array(count * 3);
    const spd    = new Float32Array(count);
    const ph     = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = Math.random() * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
      spd[i] = 0.4 + Math.random() * 0.8;
      ph[i]  = Math.random() * Math.PI * 2;
    }
    return { positions: pos, speeds: spd, phases: ph };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i * 3]     + Math.sin(t * speeds[i] + phases[i]) * 0.8,
        positions[i * 3 + 1] + Math.sin(t * speeds[i] * 1.3 + phases[i]) * 0.4,
        positions[i * 3 + 2] + Math.cos(t * speeds[i] * 0.7 + phases[i]) * 0.6
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      // Pulse opacity via color — use emissiveIntensity trick via scale
      const pulse = Math.abs(Math.sin(t * speeds[i] * 2 + phases[i]));
      dummy.scale.setScalar(0.03 + pulse * 0.05);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#AAFFAA" transparent opacity={0.8} />
    </instancedMesh>
  );
}

export default function NightScene() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.y = 2 + Math.sin(t * 0.18) * 0.3;
    camera.position.x = Math.sin(t * 0.08) * 1.5;
  });

  return (
    <>
      <color attach="background" args={["#0A0F1E"]} />
      <fog attach="fog" args={["#0E1630", 60, 200]} />
      <ambientLight intensity={0.15} color="#2040A0" />

      <Stars
        radius={80}
        depth={40}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.6}
      />
      <Aurora />

      <Moon />

      {/* Background mountains */}
      <Mountain position={[-18, -3, -50]} scale={10} color="#141E36" />
      <Mountain position={[0,  -3, -60]} scale={14} color="#10182E" />
      <Mountain position={[20, -3, -50]} scale={11} color="#141E36" />
      {/* Mid mountains */}
      <Mountain position={[-10, -4, -30]} scale={7}  color="#0E1A2C" />
      <Mountain position={[8,   -4, -28]} scale={8}  color="#0C1828" />
      {/* Ground plane */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -5, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#060C18" roughness={1} />
      </mesh>

      <Fireflies />
    </>
  );
}
