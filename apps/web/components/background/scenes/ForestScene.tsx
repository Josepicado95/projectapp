"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

// ── Sky gradient (NDC fullscreen quad, drawn before everything) ───────────────
const SKY_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 1.0, 1.0); }
`;
const SKY_FRAG = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vec3 top = vec3(0.060, 0.052, 0.178);
    vec3 mid = vec3(0.052, 0.118, 0.280);
    vec3 bot = vec3(0.072, 0.210, 0.390);
    float t = vUv.y;
    vec3 col = t > 0.5 ? mix(mid, top, (t - 0.5) * 2.0) : mix(bot, mid, t * 2.0);
    col += vec3(0.018, 0.038, 0.065) * (1.0 - vUv.y) * (1.0 - vUv.x) * 0.5;
    col += vec3(0.025, 0.012, 0.045) * pow(vUv.y, 2.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function SkyGradient() {
  return (
    <mesh renderOrder={-2} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial vertexShader={SKY_VERT} fragmentShader={SKY_FRAG} depthTest={false} depthWrite={false} />
    </mesh>
  );
}

// ── Aurora curtains ───────────────────────────────────────────────────────────
const AURORA_VERT = /* glsl */ `
  uniform float uTime; uniform float uSpd; varying vec2 vUv;
  void main() {
    vUv = uv; vec3 p = position;
    p.y += sin(p.x * 0.10 + uTime * uSpd) * 2.8
         + sin(p.x * 0.26 + uTime * uSpd * 1.6) * 1.3
         + cos(p.x * 0.52 + uTime * uSpd * 0.8) * 0.7;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const AURORA_FRAG = /* glsl */ `
  uniform vec3 uC1; uniform vec3 uC2; varying vec2 vUv;
  void main() {
    float xM = sin(vUv.x * 3.14159);
    float yF = 1.0 - pow(abs(vUv.y - 0.5) * 2.0, 1.6);
    float a  = xM * max(0.0, yF) * 0.72;
    gl_FragColor = vec4(mix(uC1, uC2, smoothstep(0.1, 0.9, vUv.x)), a);
  }
`;

function AuroraCurtain({ y, z, w, h, c1, c2, spd, timeOffset }: {
  y: number; z: number; w: number; h: number;
  c1: string; c2: string; spd: number; timeOffset: number;
}) {
  const matRef   = useRef<THREE.ShaderMaterial>(null!);
  useFrame(({ clock }) => { matRef.current.uniforms.uTime.value = clock.getElapsedTime() + timeOffset; });
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpd:  { value: spd },
    uC1:   { value: new THREE.Color(c1) },
    uC2:   { value: new THREE.Color(c2) },
  }), [c1, c2, spd]);
  return (
    <mesh position={[0, y, z]}>
      <planeGeometry args={[w, h, 200, 1]} />
      <shaderMaterial ref={matRef} vertexShader={AURORA_VERT} fragmentShader={AURORA_FRAG}
        uniforms={uniforms} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// ── Moon with glow halos ──────────────────────────────────────────────────────
const HALO_VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const HALO_FRAG = /* glsl */ `uniform float uA; varying vec2 vUv; void main() { float d = distance(vUv, vec2(0.5)) * 2.0; gl_FragColor = vec4(0.95, 0.92, 0.84, smoothstep(1.0, 0.0, d) * uA); }`;
const HALOS = [{ r: 9, a: 0.06 }, { r: 6, a: 0.12 }, { r: 4, a: 0.22 }, { r: 2.8, a: 0.36 }];

function MoonHalo({ r, a }: { r: number; a: number }) {
  const uniforms = useMemo(() => ({ uA: { value: a } }), [a]);
  return (
    <mesh>
      <circleGeometry args={[r, 48]} />
      <shaderMaterial vertexShader={HALO_VERT} fragmentShader={HALO_FRAG}
        uniforms={uniforms} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Moon() {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => { groupRef.current.position.y = 26 + Math.sin(clock.getElapsedTime() * 0.08) * 0.5; });
  return (
    <group ref={groupRef} position={[-16, 26, -120]}>
      {HALOS.map(({ r, a }, i) => <MoonHalo key={i} r={r} a={a} />)}
      <mesh>
        <circleGeometry args={[1.95, 64]} />
        <meshBasicMaterial color={0xF0EAD8} fog={false} />
      </mesh>
    </group>
  );
}

// ── Mountain silhouettes ──────────────────────────────────────────────────────
const MTN_DEFS = [
  { baseY: -1.5, z: -100, color: 0x1A3254, seed: 0.4, amp: [3.5, 2.0, 0.9, 0.35] },
  { baseY: -2.2, z: -80,  color: 0x112540, seed: 1.1, amp: [2.8, 1.6, 0.7, 0.28] },
  { baseY: -2.8, z: -60,  color: 0x0A1A2E, seed: 2.0, amp: [2.2, 1.2, 0.5, 0.22] },
];

function Mountains() {
  const shapes = useMemo(() =>
    MTN_DEFS.map(({ baseY, seed, amp }) => {
      const shape = new THREE.Shape();
      shape.moveTo(-90, -6);
      for (let i = 0; i <= 80; i++) {
        const tx = i / 80, x = -90 + tx * 180;
        const y = baseY
          + amp[0] * Math.sin(tx * 2.9 * Math.PI + seed)
          + amp[1] * Math.sin(tx * 6.5 * Math.PI + seed * 1.3)
          + amp[2] * Math.sin(tx * 13  * Math.PI + seed * 0.7)
          + amp[3] * Math.cos(tx * 24  * Math.PI + seed * 2.2);
        shape.lineTo(x, y);
      }
      shape.lineTo(90, -6);
      return shape;
    }), []);
  return (
    <>
      {MTN_DEFS.map(({ z, color }, i) => (
        <mesh key={i} position={[0, 0, z]}>
          <shapeGeometry args={[shapes[i]]} />
          <meshBasicMaterial color={color} fog={false} />
        </mesh>
      ))}
    </>
  );
}

// ── Pine trees ────────────────────────────────────────────────────────────────
const FOREST_LAYERS = [
  { z: -65, n: 12, s: 5.0, sp: 100, t: 0.90 },
  { z: -50, n: 10, s: 4.2, sp: 85,  t: 0.78 },
  { z: -36, n: 10, s: 3.4, sp: 70,  t: 0.62 },
  { z: -24, n:  9, s: 2.8, sp: 56,  t: 0.46 },
  { z: -15, n:  8, s: 2.2, sp: 44,  t: 0.32 },
  { z:  -8, n:  8, s: 1.8, sp: 34,  t: 0.18 },
  { z:  -3, n:  7, s: 1.5, sp: 26,  t: 0.08 },
  { z:   2, n:  5, s: 2.4, sp: 30,  t: 0.01 },
  { z:   7, n:  4, s: 3.8, sp: 36,  t: 0.00 },
];

type TreeDef = {
  id: string; x: number; z: number; scale: number;
  color: THREE.Color; swayAmp: number; swayPeriod: number; swayPhase: number;
};

const CONE_LAYERS: [number, number, number][] = [
  [1.05, 1.15, 0.50],
  [0.82, 1.05, 0.98],
  [0.58, 0.95, 1.38],
  [0.36, 0.84, 1.72],
];

function Forest() {
  const groupRef = useRef<(THREE.Group | null)[]>([]);

  const trees: TreeDef[] = useMemo(() => {
    const out: TreeDef[] = [];
    for (const layer of FOREST_LAYERS) {
      for (let i = 0; i < layer.n; i++) {
        const x     = (Math.random() - 0.5) * 2 * layer.sp;
        const z     = layer.z + (Math.random() - 0.5) * 4;
        const scale = layer.s * (0.78 + Math.random() * 0.44);
        const color = new THREE.Color(0x061018).lerp(new THREE.Color(0x2A5875), layer.t * 0.78);
        out.push({
          id: `${layer.z}-${i}`,
          x, z, scale, color,
          swayAmp:    (0.006 + Math.random() * 0.010) * Math.min(scale, 3),
          swayPeriod: 4.5 + Math.random() * 3.5,
          swayPhase:  Math.random() * Math.PI * 2,
        });
      }
    }
    return out;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < groupRef.current.length; i++) {
      const g = groupRef.current[i];
      if (!g) continue;
      const { swayAmp, swayPeriod, swayPhase } = trees[i];
      g.rotation.z = Math.sin(t * (Math.PI * 2 / swayPeriod) + swayPhase) * swayAmp;
    }
  });

  return (
    <>
      {trees.map((tr, idx) => (
        <group key={tr.id} ref={(el) => { groupRef.current[idx] = el; }} position={[tr.x, 0, tr.z]}>
          <mesh position={[0, 0.22 * tr.scale, 0]}>
            <cylinderGeometry args={[0.07 * tr.scale, 0.11 * tr.scale, 0.45 * tr.scale, 7]} />
            <meshLambertMaterial color={tr.color} />
          </mesh>
          {CONE_LAYERS.map(([r, h, py], ci) => (
            <mesh key={ci} position={[0, py * tr.scale, 0]}>
              <coneGeometry args={[r * tr.scale, h * tr.scale, 8]} />
              <meshLambertMaterial color={tr.color} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

// ── Fireflies ─────────────────────────────────────────────────────────────────
function Fireflies() {
  const COUNT   = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const spd = new Float32Array(COUNT);
    const ph  = new Float32Array(COUNT);
    const amp = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 44;
      pos[i * 3 + 1] = 0.2 + Math.random() * 2.6;
      pos[i * 3 + 2] = -1 - Math.random() * 29;
      spd[i] = 0.18 + Math.random() * 0.38;
      ph[i]  = Math.random() * Math.PI * 2;
      amp[i] = 0.28 + Math.random() * 0.55;
    }
    return { pos, spd, ph, amp };
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const blink = Math.abs(Math.sin(t * 1.7 * data.spd[i] + data.ph[i]));
      dummy.position.set(
        data.pos[i * 3]     + Math.sin(t * data.spd[i] + data.ph[i]) * data.amp[i] * 1.3,
        data.pos[i * 3 + 1] + Math.sin(t * data.spd[i] * 0.65 + data.ph[i] + 1.4) * data.amp[i] * 0.5,
        data.pos[i * 3 + 2] + Math.cos(t * data.spd[i] * 0.38 + data.ph[i]) * data.amp[i] * 0.7,
      );
      dummy.scale.setScalar(0.04 + blink * 0.08);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#FFD060" transparent opacity={0.92} />
    </instancedMesh>
  );
}

// ── Lanterns (enchanted path) ─────────────────────────────────────────────────
function Lanterns({ isStatic }: { isStatic: boolean }) {
  const COUNT   = 22;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => Array.from({ length: COUNT }, (_, i) => {
    const side = i % 2 === 0 ? 1 : -1;
    return {
      ox:    side * (1.8 + Math.sin(i * 0.9) * 1.2) + Math.sin(i * 0.4) * 0.6,
      oy:    1.5 + Math.sin(i * 0.7) * 0.8,
      oz:    -1.5 - i * 1.3,
      phase: Math.random() * Math.PI * 2,
      spd:   0.55 + Math.random() * 0.35,
      amp:   0.06 + Math.random() * 0.08,
    };
  }), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t      = clock.getElapsedTime();
    const driftX = isStatic ? 0 : t * 0.065;
    for (let i = 0; i < COUNT; i++) {
      const l     = data[i];
      const blink = 0.65 + 0.35 * Math.sin(t * 0.9 + l.phase);
      dummy.position.set(
        l.ox + driftX + Math.sin(t * l.spd + l.phase) * l.amp,
        l.oy + Math.cos(t * l.spd * 0.6 + l.phase) * l.amp * 0.35,
        l.oz,
      );
      dummy.scale.setScalar(0.07 + 0.05 * blink);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#FFB347" transparent opacity={0.95} />
    </instancedMesh>
  );
}

// ── Magic mist wisps — vertical planes with swirling spiral shader ─────────────
const WISP_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const WISP_FRAG = /* glsl */ `
  uniform float uTime; uniform float uPhase; uniform float uWarm;
  varying vec2 vUv;
  void main(){
    vec2 c = vUv - vec2(0.5, 0.0);
    float angle = atan(c.y, c.x + 0.001);
    float r = length(c);
    float swirl = sin(angle*2.5 + r*7.0 - uTime*0.38 + uPhase)*0.5+0.5;
    swirl *= sin(vUv.y*5.0 + uTime*0.22 + uPhase*1.4)*0.5+0.5;
    swirl += sin(vUv.x*10.0 + vUv.y*8.0 - uTime*0.55 + uPhase)*0.07;
    float eX = smoothstep(0.0,0.28,vUv.x)*smoothstep(1.0,0.72,vUv.x);
    float eY = smoothstep(0.0,0.04,vUv.y)*smoothstep(1.0,0.18,vUv.y);
    float alpha = swirl * eX * eY * 0.20;
    vec3 warm = vec3(1.00, 0.85, 0.55);
    vec3 cool = vec3(0.75, 0.88, 1.00);
    vec3 col = mix(cool, warm, uWarm) * (0.7 + 0.3*swirl);
    gl_FragColor = vec4(col, alpha);
  }
`;

type WispDef = { x: number; z: number; w: number; h: number; phase: number; warm: number };
const WISP_DEFS: WispDef[] = [
  { x: -4, z:  -5, w: 3.5, h:  7, phase: 0.0, warm: 0.85 },
  { x:  3, z:  -8, w: 4.0, h:  9, phase: 1.2, warm: 0.70 },
  { x: -7, z: -12, w: 3.0, h:  8, phase: 2.5, warm: 0.30 },
  { x:  6, z: -10, w: 3.5, h:  7, phase: 3.8, warm: 0.90 },
  { x: -2, z: -16, w: 4.5, h: 10, phase: 0.9, warm: 0.20 },
  { x:  9, z: -14, w: 3.0, h:  8, phase: 5.1, warm: 0.75 },
  { x:-10, z:  -7, w: 2.8, h:  7, phase: 4.4, warm: 0.40 },
  { x:  1, z:  -6, w: 3.2, h:  8, phase: 2.0, warm: 0.60 },
  { x: -5, z: -20, w: 5.0, h: 10, phase: 1.6, warm: 0.15 },
  { x:  4, z: -19, w: 3.8, h:  9, phase: 3.3, warm: 0.85 },
];

function MistWisp({ def, isStatic }: { def: WispDef; isStatic: boolean }) {
  const meshRef  = useRef<THREE.Mesh>(null!);
  const uniforms = useMemo(() => ({
    uTime:  { value: 0 },
    uPhase: { value: def.phase },
    uWarm:  { value: def.warm },
  }), [def.phase, def.warm]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    if (!isStatic && meshRef.current) {
      meshRef.current.position.x = def.x + clock.getElapsedTime() * 0.065;
    }
  });

  return (
    <mesh ref={meshRef} position={[def.x, def.h / 2 - 0.5, def.z]}>
      <planeGeometry args={[def.w, def.h]} />
      <shaderMaterial vertexShader={WISP_VERT} fragmentShader={WISP_FRAG}
        uniforms={uniforms} transparent depthWrite={false}
        blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Ground light pools (moonlight blue + lantern warm) ────────────────────────
const POOL_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const POOL_FRAG = /* glsl */ `uniform vec3 uCol; uniform float uA; varying vec2 vUv; void main(){ float d=length(vUv-0.5)*2.0; gl_FragColor=vec4(uCol, smoothstep(1.0,0.0,d)*uA); }`;

type PoolDef = { x: number; z: number; r: number; col: string; alpha: number };
const POOL_DEFS: PoolDef[] = [
  { x: -3,  z: -18, r: 4.5, col: "#8BBCE8", alpha: 0.14 },
  { x:  6,  z: -28, r: 5.5, col: "#9AC8F0", alpha: 0.11 },
  { x: -8,  z: -38, r: 4.0, col: "#7EB4E0", alpha: 0.12 },
  { x:  2,  z: -50, r: 6.0, col: "#8BBCE8", alpha: 0.09 },
  { x:-14,  z: -22, r: 3.5, col: "#A0CCF4", alpha: 0.10 },
  { x: 10,  z: -14, r: 3.0, col: "#9AC8F0", alpha: 0.13 },
  { x: -2,  z:  -2, r: 1.8, col: "#FFB347", alpha: 0.30 },
  { x:  2,  z:  -4, r: 1.5, col: "#FFCC66", alpha: 0.28 },
  { x: -2,  z:  -7, r: 1.6, col: "#FF9933", alpha: 0.26 },
  { x:  2,  z: -10, r: 1.4, col: "#FFB347", alpha: 0.24 },
  { x: -2,  z: -13, r: 1.5, col: "#FFCC66", alpha: 0.22 },
  { x:  2,  z: -16, r: 1.3, col: "#FF9933", alpha: 0.20 },
  { x: -2,  z: -20, r: 1.4, col: "#FFB347", alpha: 0.18 },
  { x:  2,  z: -24, r: 1.2, col: "#FFCC66", alpha: 0.15 },
];

function GroundPool({ p }: { p: PoolDef }) {
  const uniforms = useMemo(() => ({
    uCol: { value: new THREE.Color(p.col) },
    uA:   { value: p.alpha },
  }), [p.col, p.alpha]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[p.x, 0, p.z]}>
      <circleGeometry args={[p.r, 32]} />
      <shaderMaterial vertexShader={POOL_VERT} fragmentShader={POOL_FRAG}
        uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function GroundPools({ isStatic }: { isStatic: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (isStatic || !groupRef.current) return;
    groupRef.current.position.x = clock.getElapsedTime() * 0.065;
  });
  return (
    <group ref={groupRef} position={[0, 0.02, 0]}>
      {POOL_DEFS.map((p, i) => <GroundPool key={i} p={p} />)}
    </group>
  );
}

// ── Camera + lights ───────────────────────────────────────────────────────────
function CameraAndLights({ isStatic }: { isStatic: boolean }) {
  const moonLightRef = useRef<THREE.DirectionalLight>(null!);
  const glowRef      = useRef<THREE.PointLight>(null!);
  const ground1Ref   = useRef<THREE.PointLight>(null!);
  const ground2Ref   = useRef<THREE.PointLight>(null!);

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    if (isStatic) {
      camera.position.x = Math.sin(t * 0.016) * 0.18;
      camera.position.y = 0.8 + Math.sin(t * 0.022) * 0.05;
      camera.lookAt(0, 3.2, -12);
    } else {
      const driftX = t * 0.065;
      camera.position.x = driftX + Math.sin(t * 0.018) * 0.35;
      camera.position.y = 0.8 + Math.sin(t * 0.027) * 0.09;
      camera.lookAt(driftX * 0.15, 3.2, -12);
      const cx = camera.position.x;
      glowRef.current.position.set(cx + 1.2, 0.3, -3);
      ground1Ref.current.position.set(cx + 3 + Math.sin(t * 0.22) * 2, 0.2, -8);
      ground2Ref.current.position.set(cx - 2 + Math.sin(t * 0.18) * 2, 0.2, -14);
      moonLightRef.current.position.set(cx - 8, 14, 5);
    }
  });

  return (
    <>
      <directionalLight ref={moonLightRef} color={0x8BBCE8} intensity={1.3} position={[-8, 14, 5]} />
      <hemisphereLight args={[0x2A5C9A as unknown as THREE.ColorRepresentation, 0x5A3878 as unknown as THREE.ColorRepresentation, 0.85]} />
      <ambientLight color={0x1A1030} intensity={0.65} />
      <pointLight ref={glowRef}    color={0xE8901A} intensity={1.8} distance={14} decay={2} position={[1.2, 0.3, -3]} />
      <pointLight ref={ground1Ref} color={0xFF7722} intensity={2.2} distance={18} decay={2} position={[3, 0.2, -8]} />
      <pointLight ref={ground2Ref} color={0xFFAA44} intensity={1.8} distance={16} decay={2} position={[-2, 0.2, -14]} />
      <pointLight color={0xFF9933} intensity={2.2} distance={8} decay={2.2} position={[ 2, 0.5,  -2]} />
      <pointLight color={0xFFAA44} intensity={2.0} distance={8} decay={2.0} position={[-2, 0.5,  -5]} />
      <pointLight color={0xFFCC66} intensity={1.8} distance={8} decay={1.8} position={[ 2, 0.5,  -9]} />
      <pointLight color={0xFF9933} intensity={1.5} distance={8} decay={2.0} position={[-2, 0.5, -13]} />
      <pointLight color={0xFFAA44} intensity={1.2} distance={8} decay={2.0} position={[ 2, 0.5, -17]} />
    </>
  );
}

// ── Main scene ────────────────────────────────────────────────────────────────
export default function ForestScene({ isStatic = false }: { isStatic?: boolean }) {
  return (
    <>
      <color attach="background" args={["#0A1E42"]} />
      <fogExp2 attach="fog" args={["#1A3A5C", 0.007]} />

      <SkyGradient />
      <Stars radius={190} depth={20} count={1100} factor={2.5} saturation={0} fade speed={0.5} />

      <AuroraCurtain y={22} z={-130} w={320} h={16} c1="#5CB88A" c2="#4A8FD4" spd={0.28} timeOffset={0} />
      <AuroraCurtain y={26} z={-136} w={280} h={12} c1="#A8DEC8" c2="#7868C8" spd={0.22} timeOffset={3} />
      <AuroraCurtain y={18} z={-124} w={250} h={11} c1="#6EBE94" c2="#2E78B8" spd={0.38} timeOffset={7} />

      <Moon />
      <CameraAndLights isStatic={isStatic} />
      <Mountains />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshLambertMaterial color={0x0A1828} />
      </mesh>

      {WISP_DEFS.map((def, i) => <MistWisp key={i} def={def} isStatic={isStatic} />)}
      <GroundPools isStatic={isStatic} />
      <Forest />
      <Fireflies />
      <Lanterns isStatic={isStatic} />
    </>
  );
}
