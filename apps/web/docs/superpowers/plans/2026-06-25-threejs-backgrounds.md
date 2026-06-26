# Three.js Cinematic Backgrounds — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all CSS parallax backgrounds in the app with four fully 3D React Three Fiber scenes (one per time of day), with an optional weather layer and architecture ready for real weather API data.

**Architecture:** A `ThreeBackground` server-safe wrapper uses `next/dynamic({ ssr: false })` to load `ThreeCanvas`, a `"use client"` component that mounts a full-screen R3F `<Canvas>` and selects the right scene based on the `moment` prop. Content (nav, cards, forms) floats in a `z-index: 1` overlay above the canvas. Weather layers are additive components rendered inside the canvas on top of the scene.

**Tech Stack:** `three`, `@react-three/fiber`, `@react-three/drei`, TypeScript, Next.js 15 App Router.

## Global Constraints

- Working directory for all commands: `apps/web/`
- All new files are TypeScript (`.tsx` / `.ts`) — no `.js`
- `"use client"` required on every file that uses R3F hooks (`useFrame`, `useThree`, `useRef` with Three objects)
- `ThreeCanvas.tsx` and all scene/weather files: `"use client"`
- `ThreeBackground.tsx`: no `"use client"` — it's a thin `dynamic()` wrapper usable from server components
- Verify TypeScript after every task: `npx tsc --noEmit` (run from `apps/web/`)
- Commit after every task with message format: `feat(background): <what>`
- The `moment` prop must be one of: `"manana" | "tarde" | "atardecer" | "noche"` (matches `MomentKey` from `lib/theme.ts`)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/background/ThreeBackground.tsx` | Create | `dynamic()` wrapper, no SSR, exported default |
| `components/background/ThreeCanvas.tsx` | Create | `<Canvas>` + scene selector + weather layer mount |
| `components/background/scenes/NightScene.tsx` | Create | Stars, aurora GLSL, mountains, moon, fireflies |
| `components/background/scenes/MorningScene.tsx` | Create | Sunrise sky, reflective lake, pines, fog, dust |
| `components/background/scenes/AfternoonScene.tsx` | Create | Blue sky, clouds, hills, tree, butterflies |
| `components/background/scenes/SunsetScene.tsx` | Create | Sunset sky, animated ocean, rocks, seagulls |
| `components/background/weather/RainLayer.tsx` | Create | Rain particle streaks + dark cloud plane |
| `components/background/weather/SnowLayer.tsx` | Create | Snowflake sphere particles with drift |
| `lib/weather.ts` | Create | `getWeather()` stub returning `undefined` |
| `app/page.tsx` | Modify | Replace CSS parallax block with `<ThreeBackground>` |
| `components/CheckInBody.tsx` | Modify | Replace inline CSS background with `<ThreeBackground moment="noche">` |
| `app/progress/page.tsx` | Modify | Replace CSS parallax block with `<ThreeBackground>` |
| `app/login/page.tsx` | Modify | Replace CSS background with `<ThreeBackground moment="noche">` |
| `app/globals.css` | Modify | Remove `av-aurora`, `av-twinkle`, `av-glow`, `av-driftBack`, `av-pan`, `av-cross`, `av-sway`, `av-wind`, `av-fly`, `av-glide`, `av-shoot` keyframes (keep `av-bob`, `av-ring`, `av-riseA`, `av-riseB`, `lg-rise`, `lg-dawn-in`) |

---

## Task 1: Install dependencies + weather stub

**Files:**
- Modify: `package.json` (via npm install)
- Create: `lib/weather.ts`

**Interfaces:**
- Produces: `getWeather(lat: number, lon: number): Promise<WeatherCondition | undefined>` and type `WeatherCondition`

- [ ] **Step 1: Install packages**

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

Expected: packages added to `node_modules/`, no errors.

- [ ] **Step 2: Create `lib/weather.ts`**

```ts
export type WeatherCondition = "rain" | "snow" | "fog" | "storm" | "clear";

// Stub — always returns undefined (clear). Wire to Open-Meteo API in a future task.
export async function getWeather(
  _lat: number,
  _lon: number
): Promise<WeatherCondition | undefined> {
  return undefined;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/weather.ts package.json package-lock.json
git commit -m "feat(background): install R3F deps + weather stub"
```

---

## Task 2: ThreeBackground wrapper + ThreeCanvas skeleton

**Files:**
- Create: `components/background/ThreeBackground.tsx`
- Create: `components/background/ThreeCanvas.tsx`

**Interfaces:**
- Consumes: `WeatherCondition` from `lib/weather.ts`; `MomentKey` from `lib/theme.ts`
- Produces:
  - `ThreeBackground({ moment: MomentKey, weather?: WeatherCondition })` — default export, usable from server components
  - `ThreeCanvas({ moment: MomentKey, weather?: WeatherCondition })` — internal client component

- [ ] **Step 1: Create `components/background/ThreeBackground.tsx`**

```tsx
import dynamic from "next/dynamic";
import type { MomentKey } from "@/lib/theme";
import type { WeatherCondition } from "@/lib/weather";

const ThreeCanvas = dynamic(() => import("./ThreeCanvas"), { ssr: false });

type Props = {
  moment: MomentKey;
  weather?: WeatherCondition;
};

export default function ThreeBackground({ moment, weather }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <ThreeCanvas moment={moment} weather={weather} />
    </div>
  );
}
```

- [ ] **Step 2: Create `components/background/ThreeCanvas.tsx`**

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import type { MomentKey } from "@/lib/theme";
import type { WeatherCondition } from "@/lib/weather";

type Props = {
  moment: MomentKey;
  weather?: WeatherCondition;
};

export default function ThreeCanvas({ moment, weather }: Props) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ fov: 60, near: 0.1, far: 500, position: [0, 2, 10] }}
      gl={{ alpha: false, antialias: true }}
    >
      {/* Placeholder: solid dark sky while scenes are built */}
      <color attach="background" args={["#0E1630"]} />
      <ambientLight intensity={0.4} />
    </Canvas>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/background/ThreeBackground.tsx components/background/ThreeCanvas.tsx
git commit -m "feat(background): ThreeBackground wrapper + ThreeCanvas skeleton"
```

---

## Task 3: NightScene — stars, moon, mountains

**Files:**
- Create: `components/background/scenes/NightScene.tsx`

**Interfaces:**
- Produces: `NightScene()` — default export, `"use client"`, no props

- [ ] **Step 1: Create `components/background/scenes/NightScene.tsx`**

```tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

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
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/background/scenes/NightScene.tsx
git commit -m "feat(background): NightScene part 1 — stars, moon, mountains, fireflies"
```

---

## Task 4: NightScene — aurora GLSL shader

**Files:**
- Modify: `components/background/scenes/NightScene.tsx`

**Interfaces:**
- Consumes: `NightScene` from Task 3

- [ ] **Step 1: Add Aurora component at the top of `NightScene.tsx`** (before the `Moon` function)

Add these imports at the top:
```tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
```

Add the `Aurora` component right after the imports:
```tsx
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
```

- [ ] **Step 2: Add `<Aurora />` inside the `NightScene` return**, just after `<Stars>`:

```tsx
<Stars ... />
<Aurora />
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/background/scenes/NightScene.tsx
git commit -m "feat(background): NightScene aurora GLSL shader"
```

---

## Task 5: Wire NightScene + integrate in dashboard

**Files:**
- Modify: `components/background/ThreeCanvas.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `NightScene` from Task 3–4; `ThreeBackground` from Task 2

- [ ] **Step 1: Update `ThreeCanvas.tsx`** to import and use NightScene:

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { MomentKey } from "@/lib/theme";
import type { WeatherCondition } from "@/lib/weather";
import NightScene from "./scenes/NightScene";

// Remaining scenes imported here as they are built (Tasks 6–8)

type Props = {
  moment: MomentKey;
  weather?: WeatherCondition;
};

function SceneSelector({ moment }: { moment: MomentKey }) {
  switch (moment) {
    case "noche":     return <NightScene />;
    case "manana":    return <NightScene />; // placeholder until Task 6
    case "tarde":     return <NightScene />; // placeholder until Task 7
    case "atardecer": return <NightScene />; // placeholder until Task 8
  }
}

export default function ThreeCanvas({ moment, weather }: Props) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ fov: 60, near: 0.1, far: 500, position: [0, 2, 10] }}
      gl={{ alpha: false, antialias: true }}
    >
      <Suspense fallback={null}>
        <SceneSelector moment={moment} />
      </Suspense>
    </Canvas>
  );
}
```

- [ ] **Step 2: Update `app/page.tsx`**

Add import at the top (after existing imports):
```tsx
import ThreeBackground from "@/components/background/ThreeBackground";
```

Replace the entire `return (...)` block with:
```tsx
return (
  <div style={{ height: "100vh", overflow: "hidden", position: "relative" }}>

    {/* 3D cinematic background */}
    <ThreeBackground moment={theme.key} />

    {/* Content layer */}
    <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 1 }}>

      {/* Nav Rail */}
      <div className="av-nav-rail" style={{
        flexShrink: 0, width: 84,
        background: "rgba(10,15,26,.66)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRight: "1px solid rgba(236,230,216,.1)",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "22px 0",
        isolation: "isolate",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: "radial-gradient(circle at 60% 35%, #F0EAD8, #9DB6A4)",
          boxShadow: "0 0 18px rgba(240,234,216,.3)",
          marginBottom: 24, flexShrink: 0,
        }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 15,
              background: "rgba(91,155,209,.2)", border: "1px solid rgba(146,199,230,.45)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, color: "#CDE6F5", cursor: "pointer",
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>⛰</span>
              <span style={{ fontSize: 9, fontWeight: 600 }}>Aventuras</span>
            </div>
          </Link>
          <Link href="/checkin" style={{ textDecoration: "none" }}>
            <div style={{
              position: "relative",
              width: 56, height: 56, borderRadius: 15,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, color: "#9FB4C6", cursor: "pointer",
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>♡</span>
              <span style={{ fontSize: 9, fontWeight: 600 }}>Check-in</span>
              {!todayCheckIn && (
                <span style={{
                  position: "absolute", top: 9, right: 13,
                  width: 9, height: 9, borderRadius: "50%",
                  background: "#7E9A86", border: "2px solid rgba(10,15,26,.9)",
                }} />
              )}
            </div>
          </Link>
          <Link href="/progress" style={{ textDecoration: "none" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 15,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, color: "#9FB4C6", cursor: "pointer",
            }}>
              <span style={{ fontSize: 17, lineHeight: 1 }}>◷</span>
              <span style={{ fontSize: 9, fontWeight: 600 }}>Progreso</span>
            </div>
          </Link>
        </div>
        <div style={{ marginTop: "auto" }}>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Cerrar sesión"
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: theme.avatarBg, color: theme.avatarInk,
                border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {initial}
            </button>
          </form>
        </div>
      </div>

      {/* Dashboard body */}
      <DashboardBody
        adventures={adventures}
        todayCheckIn={todayCheckIn}
        recommendations={recommendations}
        theme={theme}
        firstName={firstName ?? ""}
        streak={streak}
        doneMissions={doneMissions}
        totalMissions={totalMissions}
        weekDays={weekDays}
      />
    </div>

    {/* Bottom nav — mobile */}
    <div className="av-bottom-nav" style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(10,15,26,.88)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      borderTop: "1px solid rgba(236,230,216,.1)",
      padding: "10px 0 16px",
      justifyContent: "space-around", alignItems: "center",
      zIndex: 60,
    }}>
      <Link href="/" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#CDE6F5" }}>
        <span style={{ fontSize: 22 }}>⛰</span>
        <span style={{ fontSize: 9, fontWeight: 600 }}>Aventuras</span>
      </Link>
      <Link href="/checkin" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#9FB4C6", position: "relative" }}>
        <span style={{ fontSize: 22 }}>♡</span>
        <span style={{ fontSize: 9, fontWeight: 600 }}>Check-in</span>
        {!todayCheckIn && (
          <span style={{ position: "absolute", top: -1, right: -4, width: 8, height: 8, borderRadius: "50%", background: "#7E9A86", border: "2px solid rgba(10,15,26,.9)" }} />
        )}
      </Link>
      <Link href="/progress" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#9FB4C6" }}>
        <span style={{ fontSize: 22 }}>◷</span>
        <span style={{ fontSize: 9, fontWeight: 600 }}>Progreso</span>
      </Link>
    </div>

  </div>
);
```

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit && npm run build
```

Expected: build succeeds. Open `http://localhost:3000` with `npm run dev` and confirm the 3D night scene renders behind the dashboard cards.

- [ ] **Step 4: Commit**

```bash
git add components/background/ThreeCanvas.tsx app/page.tsx
git commit -m "feat(background): integrate NightScene in dashboard"
```

---

## Task 6: MorningScene

**Files:**
- Create: `components/background/scenes/MorningScene.tsx`

**Interfaces:**
- Produces: `MorningScene()` — default export, `"use client"`, no props

- [ ] **Step 1: Create `components/background/scenes/MorningScene.tsx`**

```tsx
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
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = -1 + Math.random() * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
      spd[i] = 0.1 + Math.random() * 0.25;
      ph[i]  = Math.random() * Math.PI * 2;
    }
    return { pos, spd, ph };
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
      dummy.scale.setScalar(0.015 + Math.random() * 0.01);
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
```

- [ ] **Step 2: Wire in ThreeCanvas** — replace the `"manana"` placeholder in `ThreeCanvas.tsx`:

```tsx
import MorningScene from "./scenes/MorningScene";

// In SceneSelector:
case "manana": return <MorningScene />;
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/background/scenes/MorningScene.tsx components/background/ThreeCanvas.tsx
git commit -m "feat(background): MorningScene — sunrise lake + pines + dust"
```

---

## Task 7: AfternoonScene

**Files:**
- Create: `components/background/scenes/AfternoonScene.tsx`

**Interfaces:**
- Produces: `AfternoonScene()` — default export, `"use client"`, no props

- [ ] **Step 1: Create `components/background/scenes/AfternoonScene.tsx`**

```tsx
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
  }, []);

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
```

- [ ] **Step 2: Wire in ThreeCanvas** — replace `"tarde"` placeholder:

```tsx
import AfternoonScene from "./scenes/AfternoonScene";

// In SceneSelector:
case "tarde": return <AfternoonScene />;
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/background/scenes/AfternoonScene.tsx components/background/ThreeCanvas.tsx
git commit -m "feat(background): AfternoonScene — meadow, clouds, tree, butterflies"
```

---

## Task 8: SunsetScene

**Files:**
- Create: `components/background/scenes/SunsetScene.tsx`

**Interfaces:**
- Produces: `SunsetScene()` — default export, `"use client"`, no props

- [ ] **Step 1: Create `components/background/scenes/SunsetScene.tsx`**

```tsx
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
    (meshRef.current.geometry as THREE.PlaneGeometry).computeVertexNormals();
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
```

- [ ] **Step 2: Wire in ThreeCanvas** — replace `"atardecer"` placeholder:

```tsx
import SunsetScene from "./scenes/SunsetScene";

// In SceneSelector:
case "atardecer": return <SunsetScene />;
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/background/scenes/SunsetScene.tsx components/background/ThreeCanvas.tsx
git commit -m "feat(background): SunsetScene — coast, animated ocean, rocks, seagulls"
```

---

## Task 9: Weather layers (Rain + Snow)

**Files:**
- Create: `components/background/weather/RainLayer.tsx`
- Create: `components/background/weather/SnowLayer.tsx`
- Modify: `components/background/ThreeCanvas.tsx`

**Interfaces:**
- Produces: `RainLayer()`, `SnowLayer()` — default exports, `"use client"`, no props

- [ ] **Step 1: Create `components/background/weather/RainLayer.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `components/background/weather/SnowLayer.tsx`**

```tsx
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
```

- [ ] **Step 3: Wire weather layers in `ThreeCanvas.tsx`**

Add imports and a `WeatherLayer` component:

```tsx
import RainLayer from "./weather/RainLayer";
import SnowLayer from "./weather/SnowLayer";

function WeatherLayer({ weather }: { weather?: WeatherCondition }) {
  if (!weather || weather === "clear") return null;
  if (weather === "rain" || weather === "storm") return <RainLayer />;
  if (weather === "snow") return <SnowLayer />;
  return null; // fog handled via scene fog; storm = rain at higher intensity
}
```

Inside `<Canvas>` after `<SceneSelector>`:
```tsx
<WeatherLayer weather={weather} />
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add components/background/weather/RainLayer.tsx components/background/weather/SnowLayer.tsx components/background/ThreeCanvas.tsx
git commit -m "feat(background): RainLayer + SnowLayer weather overlays"
```

---

## Task 10: Integrate ThreeBackground in all remaining pages

**Files:**
- Modify: `components/CheckInBody.tsx`
- Modify: `app/progress/page.tsx`
- Modify: `app/login/page.tsx`

**Interfaces:**
- Consumes: `ThreeBackground` from Task 2

### CheckInBody.tsx

- [ ] **Step 1: Update `components/CheckInBody.tsx`**

Add import at top (after `"use client"`):
```tsx
import ThreeBackground from "@/components/background/ThreeBackground";
```

Replace the outer `<div style={{ position:"relative", width:"100%", height:"100vh", ... }}>` and everything inside it up to (but NOT including) the layout div, with:

Find this block and the style tag and dawn curtain and animated background divs — remove them all. Specifically remove:
1. The `<style dangerouslySetInnerHTML={{ __html: ... }} />` block (keep only `ci-pulse`, `ci-checkIn`, `ci-enterR*`, `ci-enterL*` keyframes — these are NOT in globals.css)
2. The dawn curtain `<div>` (position:absolute, zIndex:8, animation:av-dawn)
3. The entire "Animated background" `<div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>` block (aurora ribbons, moon, mountains)

Then add `<ThreeBackground moment="noche" />` as the first child inside the outermost div, right before the `<style>` tag.

The new structure of the return should be:
```tsx
return (
  <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden",
    fontFamily: "var(--font-hanken), sans-serif" }}>

    <ThreeBackground moment="noche" />

    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes ci-pulse   { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
      @keyframes ci-checkIn { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
      @keyframes ci-enterRA { from{opacity:0;transform:translateX(36px)} to{opacity:1;transform:translateX(0)} }
      @keyframes ci-enterRB { from{opacity:0;transform:translateX(36px)} to{opacity:1;transform:translateX(0)} }
      @keyframes ci-enterLA { from{opacity:0;transform:translateX(-36px)} to{opacity:1;transform:translateX(0)} }
      @keyframes ci-enterLB { from{opacity:0;transform:translateX(-36px)} to{opacity:1;transform:translateX(0)} }
    `}} />

    {/* Layout */}
    <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 1 }}>
      {/* ... rest of existing JSX unchanged ... */}
    </div>
  </div>
);
```

### app/progress/page.tsx

- [ ] **Step 2: Update `app/progress/page.tsx`**

Add import:
```tsx
import ThreeBackground from "@/components/background/ThreeBackground";
```

Replace the return block. The current return has a large CSS parallax background. Replace the entire outer structure with:
```tsx
return (
  <div style={{ height: "100vh", overflow: "hidden", position: "relative" }}>

    <ThreeBackground moment={theme.key} />

    {/* Layout: nav rail + scrollable content */}
    <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 1 }}>
      {/* Keep the nav rail and main content exactly as they are now */}
      {/* (the av-nav-rail div, the scrollable div, and all their children) */}
    </div>

    {/* Bottom nav (mobile) — keep as is */}
    <div className="av-bottom-nav" style={{ ... }}>
      {/* keep existing links */}
    </div>

  </div>
);
```

Remove all parallax layer divs (aurora, stars, moon, bird, mountains, trees) that currently appear between the outer wrapper and the layout div.

### app/login/page.tsx

- [ ] **Step 3: Read `app/login/page.tsx`** to identify the background block, then replace it with `<ThreeBackground moment="noche" />` using the same pattern as above.

### Verify

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Build**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add components/CheckInBody.tsx app/progress/page.tsx app/login/page.tsx
git commit -m "feat(background): integrate ThreeBackground in checkin, progress, login"
```

---

## Task 11: Final ThreeCanvas with all scenes wired

After Tasks 6, 7, 8 each updated `ThreeCanvas.tsx` incrementally, confirm the final file looks like this:

**Files:**
- Verify: `components/background/ThreeCanvas.tsx`

- [ ] **Step 1: Confirm `ThreeCanvas.tsx` final state**

The file should be:

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { MomentKey } from "@/lib/theme";
import type { WeatherCondition } from "@/lib/weather";
import NightScene     from "./scenes/NightScene";
import MorningScene   from "./scenes/MorningScene";
import AfternoonScene from "./scenes/AfternoonScene";
import SunsetScene    from "./scenes/SunsetScene";
import RainLayer      from "./weather/RainLayer";
import SnowLayer      from "./weather/SnowLayer";

type Props = {
  moment: MomentKey;
  weather?: WeatherCondition;
};

function SceneSelector({ moment }: { moment: MomentKey }) {
  switch (moment) {
    case "noche":     return <NightScene />;
    case "manana":    return <MorningScene />;
    case "tarde":     return <AfternoonScene />;
    case "atardecer": return <SunsetScene />;
  }
}

function WeatherLayer({ weather }: { weather?: WeatherCondition }) {
  if (!weather || weather === "clear") return null;
  if (weather === "rain" || weather === "storm") return <RainLayer />;
  if (weather === "snow") return <SnowLayer />;
  return null;
}

export default function ThreeCanvas({ moment, weather }: Props) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ fov: 60, near: 0.1, far: 500, position: [0, 2, 10] }}
      gl={{ alpha: false, antialias: true }}
    >
      <Suspense fallback={null}>
        <SceneSelector moment={moment} />
        <WeatherLayer weather={weather} />
      </Suspense>
    </Canvas>
  );
}
```

- [ ] **Step 2: Run final TypeScript + build check**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 3: Commit if any changes were needed**

```bash
git add components/background/ThreeCanvas.tsx
git commit -m "feat(background): finalize ThreeCanvas with all 4 scenes + weather"
```

---

## Task 12: Cleanup — remove unused CSS keyframes

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- No new interfaces; this is cleanup only.

- [ ] **Step 1: Remove these keyframes from `app/globals.css`**

Delete the following `@keyframes` blocks entirely (they are now handled by Three.js):
- `av-aurora`
- `av-twinkle`
- `av-glow`
- `av-driftBack`
- `av-pan`
- `av-cross`
- `av-sway`
- `av-wind`
- `av-fly`
- `av-glide`
- `av-shoot`
- `av-bob` — only remove if unused elsewhere (search with `grep -r "av-bob" app/ components/`)

**Keep these keyframes** (still used by login/register pages or other components):
- `av-drift`
- `av-riseA`
- `av-riseB`
- `lg-rise`
- `lg-dawn-in`
- `av-ring`

- [ ] **Step 2: Verify nothing broke**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "chore(background): remove unused av-* CSS keyframes replaced by Three.js"
```

---

## Summary

| Task | Deliverable |
|------|-------------|
| 1 | Dependencies installed, weather stub |
| 2 | ThreeBackground + ThreeCanvas skeleton |
| 3 | NightScene — stars, moon, mountains, fireflies |
| 4 | NightScene — aurora GLSL shader |
| 5 | NightScene wired in dashboard |
| 6 | MorningScene + wired |
| 7 | AfternoonScene + wired |
| 8 | SunsetScene + wired |
| 9 | Rain + Snow weather layers |
| 10 | All pages integrated |
| 11 | ThreeCanvas final state verified |
| 12 | CSS keyframe cleanup |
