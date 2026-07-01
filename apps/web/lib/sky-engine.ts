/**
 * sky-engine.ts — Cinematic 2.5D parallax sky engine (Three.js ES module)
 *
 * Adapted from the vanilla sky-engine.js design file.
 * Moment keys: 'dawn' | 'noon' | 'dusk' | 'night'
 *
 *   import { SkyEngine } from '@/lib/sky-engine';
 *   const ctrl = SkyEngine.init(canvas, { moment: 'night' });
 *   ctrl.setMoment('dawn');   // smooth crossfade
 *   ctrl.destroy();
 */
import * as THREE from 'three';

const TWO_PI = Math.PI * 2;

// ─── Types ────────────────────────────────────────────────────────────────────

export type SkyMomentKey = 'dawn' | 'noon' | 'dusk' | 'night';

export interface SkyEngineOpts {
  moment?: SkyMomentKey;
  static?: boolean;
}

export interface SkyEngineCtrl {
  setMoment(key: SkyMomentKey): void;
  getMoment(): SkyMomentKey | null;
  destroy(): void;
}

// ─── Moment definitions ───────────────────────────────────────────────────────

const MOMENTS = {
  dawn: {
    sky: ['#A6C2CC', '#B4CDD4', '#C4D7DA', '#D4E0DF', '#E2EAE4', '#EFF2EA'],
    horizon: -0.06,
    celestial: { x: 0.18, y: 0.70, r: 0.046, core: '#FBF4E2', glow: '#F2E8CE', glow2: '#EADFC0', isMoon: false },
    clouds: { tints: ['#FFFFFF', '#FBFCFA', '#EFF3EF'], count: 5, yMin: 0.56, yMax: 0.84, opacity: 0.9, scale: 1.5, streaky: true },
    water: null as null,
    ground: '#D9A82E',
    layers: [
      { type: 'mtn',  color: '#9FB6C0', baseY: -0.01, amp: 0.06, jag: 0.02, speed: 0.005, opacity: 1 },
      { type: 'mtn',  color: '#88A6B2', baseY: -0.06, amp: 0.05, jag: 0.02, speed: 0.009, opacity: 1 },
      { type: 'hill', color: '#E3BC46', baseY: -0.16, amp: 0.09, jag: 0.0,  speed: 0.016, opacity: 1 },
      { type: 'hill', color: '#D9A82E', baseY: -0.30, amp: 0.11, jag: 0.0,  speed: 0.024, opacity: 1 },
      { type: 'fg',   color: '#C28E20', baseY: -0.62, amp: 0.13, jag: 0.0,  speed: 0.034, opacity: 1 },
    ],
    stars: 0, fireflies: 0, gulls: 3, shootingStars: false, motes: false,
  },
  noon: {
    sky: ['#6FB0C6', '#84BDCE', '#9ACBD6', '#B6DAE0', '#D2E8E8', '#E6F2EE'],
    horizon: -0.05,
    celestial: { x: 0.24, y: 0.68, r: 0.052, core: '#FFFDF4', glow: '#FBF2D8', glow2: '#F6E8C4', isMoon: false },
    clouds: { tints: ['#FFFFFF', '#FBFEFE', '#ECF4F4'], count: 7, yMin: 0.52, yMax: 0.86, opacity: 0.95, scale: 1.5, streaky: false },
    water: null as null,
    ground: '#7BA338',
    layers: [
      { type: 'hill', color: '#9CBB54', baseY: -0.02, amp: 0.10, jag: 0.0, speed: 0.008, opacity: 1 },
      { type: 'hill', color: '#7FA63E', baseY: -0.10, amp: 0.12, jag: 0.0, speed: 0.014, opacity: 1 },
      { type: 'hill', color: '#688E30', baseY: -0.20, amp: 0.13, jag: 0.0, speed: 0.021, opacity: 1 },
      { type: 'trees', color: '#1F3D24', baseY: -0.52, amp: 0.0, jag: 0.0, speed: 0.032, opacity: 1 },
    ],
    stars: 0, fireflies: 0, gulls: 0, shootingStars: false, motes: true,
  },
  dusk: {
    sky: ['#5E5A86', '#806C94', '#AC7E94', '#D49E88', '#EABE92', '#EDD4A2'],
    horizon: -0.06,
    celestial: { x: 0.32, y: 0.40, r: 0.050, core: '#FCEAC8', glow: '#F2BC92', glow2: '#E89A78', isMoon: false },
    clouds: { tints: ['#F4CEC8', '#E6AAB2', '#CC92A4'], count: 6, yMin: 0.46, yMax: 0.76, opacity: 0.7, scale: 1.4, streaky: false },
    water: null as null,
    ground: '#587C3A',
    layers: [
      { type: 'mtn',  color: '#5E6E88', baseY: 0.0,   amp: 0.10, jag: 0.04, speed: 0.005, opacity: 1 },
      { type: 'mtn',  color: '#4C6276', baseY: -0.05, amp: 0.09, jag: 0.04, speed: 0.009, opacity: 1 },
      { type: 'hill', color: '#6E9046', baseY: -0.15, amp: 0.10, jag: 0.0,  speed: 0.016, opacity: 1 },
      { type: 'hill', color: '#557A34', baseY: -0.28, amp: 0.11, jag: 0.0,  speed: 0.024, opacity: 1 },
      { type: 'trees', color: '#33521F', baseY: -0.56, amp: 0.0, jag: 0.0,  speed: 0.034, opacity: 1 },
    ],
    stars: 0, fireflies: 0, gulls: 2, shootingStars: false, motes: false,
  },
  night: {
    sky: ['#101C38', '#162442', '#1E2E4E', '#26385C', '#324C6E', '#46688A'],
    horizon: -0.08,
    celestial: { x: 0.64, y: 0.70, r: 0.044, core: '#DDE6EA', glow: '#BCD0D6', glow2: '#9AB4BE', isMoon: true },
    clouds: { tints: ['#62AAB2', '#7AC2C6', '#8FD2D2'], count: 6, yMin: 0.42, yMax: 0.60, opacity: 0.82, scale: 1.45, streaky: false },
    water: null as null,
    ground: '#0A1320',
    layers: [
      { type: 'mtn',   color: '#33507A', baseY: 0.04,  amp: 0.20, jag: 0.06, speed: 0.006, opacity: 1 },
      { type: 'mtn',   color: '#27406A', baseY: -0.04, amp: 0.16, jag: 0.05, speed: 0.010, opacity: 1 },
      { type: 'trees', color: '#0E1A2A', baseY: -0.26, amp: 0.0,  jag: 0.0,  speed: 0.020, opacity: 1 },
      { type: 'trees', color: '#060E1A', baseY: -0.52, amp: 0.0,  jag: 0.0,  speed: 0.032, opacity: 1 },
    ],
    stars: 1.0, fireflies: 0, gulls: 0, shootingStars: true, motes: false,
  },
} as const;

// ─── Texture factories ────────────────────────────────────────────────────────

function makeStreakTexture(): THREE.CanvasTexture {
  const W = 512, H = 256;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.globalCompositeOperation = 'lighter';
  const streak = (x: number, y: number, rx: number, ry: number, peak: number) => {
    ctx.save();
    ctx.translate(x, y); ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    for (let s = 0; s <= 14; s++) { const u = s / 14; g.addColorStop(u, `rgba(255,255,255,${(peak * Math.exp(-u * u * 3.2)).toFixed(4)})`); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  const cy = H / 2;
  streak(W * 0.50, cy,      210, 26, 0.40);
  streak(W * 0.32, cy - 6,  150, 18, 0.34);
  streak(W * 0.68, cy + 4,  160, 20, 0.34);
  streak(W * 0.20, cy + 8,  100, 14, 0.26);
  streak(W * 0.80, cy - 8,  100, 14, 0.26);
  ctx.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true;
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  return tex;
}

function makeCloudTexture(): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement('canvas'); c.width = S; c.height = S / 2;
  const ctx = c.getContext('2d')!;
  const cx = S / 2, cy = S / 4;
  ctx.globalCompositeOperation = 'lighter';
  const blob = (x: number, y: number, r: number, peak: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    for (let s = 0; s <= 16; s++) {
      const u = s / 16;
      const a = peak * Math.exp(-u * u * 3.0);
      g.addColorStop(u, `rgba(255,255,255,${a.toFixed(4)})`);
    }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };
  blob(cx,       cy + 6,  150, 0.34);
  blob(cx - 95,  cy + 14, 100, 0.30);
  blob(cx + 100, cy + 16, 104, 0.30);
  blob(cx - 38,  cy - 16, 88,  0.30);
  blob(cx + 52,  cy - 12, 84,  0.30);
  blob(cx + 6,   cy - 34, 66,  0.26);
  blob(cx - 158, cy + 22, 62,  0.22);
  blob(cx + 164, cy + 24, 62,  0.22);
  blob(cx - 70,  cy + 30, 70,  0.20);
  blob(cx + 80,  cy + 30, 70,  0.20);
  ctx.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true;
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  return tex;
}

function makeGlowTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  for (let s = 0; s <= 32; s++) {
    const u = s / 32;
    const a = Math.exp(-u * u * 5.0);
    g.addColorStop(u, `rgba(255,255,255,${a.toFixed(4)})`);
  }
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true;
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  return tex;
}

// ─── Material Design "emphasized" easing — cubic-bezier(0.2, 0, 0, 1) ────────

function emphasized(x: number): number {
  const cx = 3 * 0.2, bx = 3 * (0 - 0.2) - cx, ax = 1 - cx - bx;
  const cy = 3 * 0.0, by = 3 * (1 - 0.0) - cy, ay = 1 - cy - by;
  let t = x;
  for (let i = 0; i < 5; i++) {
    const fx = ((ax * t + bx) * t + cx) * t - x;
    const d = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(d) < 1e-5) break;
    t -= fx / d;
  }
  return ((ay * t + by) * t + cy) * t;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

function create(canvas: HTMLCanvasElement, opts?: SkyEngineOpts): SkyEngineCtrl {
  const isStatic = !!(opts && opts.static);
  let aspect = window.innerWidth / window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(dpr);
  renderer.autoClear = true;

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, -100, 100);
  cam.position.z = 10;

  const cloudTex = makeCloudTexture();
  const streakTex = makeStreakTexture();
  const glowTex = makeGlowTexture();

  const SKY_N = 6;
  const skyUniforms = {
    uColors: { value: Array.from({ length: SKY_N }, () => new THREE.Color('#000')) },
    uHorizon: { value: -0.1 },
  };
  const skyMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: skyUniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy*2.0,1.0,1.0); }`,
    fragmentShader: `
      precision highp float;
      uniform vec3 uColors[${SKY_N}];
      varying vec2 vUv;
      void main(){
        float t = clamp(vUv.y, 0.0, 1.0);
        float s = (1.0 - t) * float(${SKY_N - 1});
        int i = int(floor(s));
        float f = fract(s);
        vec3 col = uColors[0];
        for(int k=0;k<${SKY_N - 1};k++){
          if(k==i){ col = mix(uColors[k], uColors[k+1], f); }
        }
        if(i >= ${SKY_N - 1}) col = uColors[${SKY_N - 1}];
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  }));
  skyMesh.frustumCulled = false; skyMesh.renderOrder = -100; scene.add(skyMesh);

  let dyn = new THREE.Group(); scene.add(dyn);
  let updaters: Array<(t: number, dt: number) => void> = [];
  let curKey: SkyMomentKey | null = null;

  const fadeMat = new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const fadeMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fadeMat);
  fadeMesh.frustumCulled = false; fadeMesh.renderOrder = 1000;
  scene.add(fadeMesh);

  // ─── Build one moment ────────────────────────────────────────────────────────

  function build(key: SkyMomentKey) {
    dyn.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m: THREE.Material) => m.dispose());
      }
    });
    scene.remove(dyn); dyn = new THREE.Group(); scene.add(dyn);
    updaters = [];
    const M = MOMENTS[key];
    const W = 2 * aspect;

    skyUniforms.uHorizon.value = M.horizon;

    // Ground fill
    const gMat = new THREE.MeshBasicMaterial({ color: M.ground, depthTest: false, depthWrite: false });
    const gMesh = new THREE.Mesh(new THREE.PlaneGeometry(W * 4, 2.4), gMat);
    gMesh.position.y = M.horizon - 1.2;
    gMesh.renderOrder = -90;
    dyn.add(gMesh);

    // Celestial body (sun / moon)
    const C = M.celestial;
    const celGroup = new THREE.Group();
    celGroup.position.set(C.x * aspect, C.y, 0);

    const glowMat = new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(C.glow), transparent: true, opacity: 0.9, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
    const glow = new THREE.Sprite(glowMat); glow.scale.set(C.r * 11, C.r * 11, 1); glow.renderOrder = -70; celGroup.add(glow);

    const glow2Mat = new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(C.glow2), transparent: true, opacity: 0.7, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
    const glow2 = new THREE.Sprite(glow2Mat); glow2.scale.set(C.r * 6, C.r * 6, 1); glow2.renderOrder = -69; celGroup.add(glow2);

    const discMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.core), transparent: true, depthTest: false, depthWrite: false });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(C.r, 64), discMat); disc.renderOrder = -68; celGroup.add(disc);

    if (C.isMoon) {
      const cm = new THREE.MeshBasicMaterial({ color: '#dcd6c4', transparent: true, opacity: 0.5, depthTest: false, depthWrite: false });
      ([[-0.3, 0.2, 0.18], [0.25, 0.3, 0.13], [0.1, -0.35, 0.16], [-0.15, -0.1, 0.10]] as [number, number, number][]).forEach(([cx, cy, cr]) => {
        const m = new THREE.Mesh(new THREE.CircleGeometry(C.r * cr, 24), cm);
        m.position.set(C.r * cx, C.r * cy, 0.01); m.renderOrder = -67; celGroup.add(m);
      });
    }
    celGroup.renderOrder = -70; dyn.add(celGroup);
    updaters.push((t) => { glow.material.opacity = 0.78 + 0.12 * Math.sin(t * 0.6); });

    // Far parallax silhouettes (behind clouds)
    M.layers.filter((l) => l.type === 'mtn' || l.type === 'hill').forEach((l) => addSilhouette(l, -50));

    // Clouds
    const CL = M.clouds;
    const streaky = !!CL.streaky;
    const clouds: Array<{ sp: THREE.Sprite; x0: number; y: number; spd: number; w: number; phase: number; bob: number }> = [];
    for (let i = 0; i < CL.count; i++) {
      const tint = CL.tints[i % CL.tints.length];
      const sMat = new THREE.SpriteMaterial({ map: streaky ? streakTex : cloudTex, color: new THREE.Color(tint), transparent: true, opacity: CL.opacity, depthTest: false, depthWrite: false });
      const sp = new THREE.Sprite(sMat);
      const sc = CL.scale * (0.6 + Math.random() * 0.9);
      if (streaky) sp.scale.set(sc * 3.0, sc * 0.34, 1);
      else sp.scale.set(sc * 1.7, sc * 0.7, 1);
      const x0 = (Math.random() * 2 - 1) * W;
      const y0 = CL.yMin + Math.random() * (CL.yMax - CL.yMin);
      sp.position.set(x0, y0, 0);
      sp.renderOrder = -60;
      dyn.add(sp);
      clouds.push({ sp, x0, y: y0, spd: 0.012 + Math.random() * 0.020, w: sc * 1.7, phase: Math.random() * TWO_PI, bob: 0.004 + Math.random() * 0.006 });
    }
    updaters.push((t, dt) => {
      clouds.forEach((c) => {
        c.sp.position.x -= c.spd * (isStatic ? 0.3 : 1) * dt * 60 * 0.016;
        if (c.sp.position.x < -W - c.w) c.sp.position.x = W + c.w;
        c.sp.position.y = c.y + Math.sin(t * 0.25 + c.phase) * c.bob;
      });
    });

    // Near parallax (trees / foreground)
    M.layers.filter((l) => l.type === 'trees' || l.type === 'fg').forEach((l) => addSilhouette(l, -40));

    // Particles
    if (M.stars > 0) addStars(M.stars);
    if (M.fireflies > 0) addFireflies();
    if (M.gulls > 0) addGulls(M.gulls);
    if (M.shootingStars) addShootingStar();
    if (M.motes) addMotes();

    // ── Silhouette builder ──────────────────────────────────────────────────
    function addSilhouette(l: typeof M.layers[number], baseRender: number) {
      const segs = 320;
      const span = W * 4;
      const shape = new THREE.Shape();
      shape.moveTo(-2 * W, -2.2);
      const freqs = [0.5, 1, 2, 3, 5];
      const amps  = [1.0, 0.6, 0.28, 0.13, 0.05];
      const phases = freqs.map((f) => (f * 1.7 + l.baseY * 3.1) % TWO_PI);
      for (let i = 0; i <= segs; i++) {
        const x = -2 * W + (i / segs) * span;
        const u = x / W;
        let y = l.baseY;
        for (let k = 0; k < freqs.length; k++) {
          y += l.amp * amps[k] * Math.sin(u * freqs[k] * Math.PI + phases[k]);
        }
        if (l.jag) {
          y += l.jag * 0.5 * Math.sin(u * 3.0 * TWO_PI + phases[0]);
        }
        shape.lineTo(x, y);
      }
      shape.lineTo(2 * W, -2.2);
      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(l.color), transparent: l.opacity < 1, opacity: l.opacity, depthTest: false, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = baseRender + Math.round(l.speed * 100);
      const grp = new THREE.Group(); grp.add(mesh); dyn.add(grp);

      if (l.type === 'trees') addPineRow(grp, l, baseRender);

      updaters.push((t) => {
        const s = isStatic ? 0 : (t * l.speed * W) % W;
        grp.position.x = -s;
      });
    }

    function addPineRow(grp: THREE.Group, l: typeof M.layers[number], baseRender: number) {
      const count = Math.round(60 / Math.max(0.5, l.speed * 40));
      const step = (W * 4) / count;
      const positions: number[] = [];
      const sway: number[] = [];
      const phase: number[] = [];
      for (let i = 0; i <= count; i++) {
        const x = -2 * W + i * step + (Math.random() - 0.5) * step * 0.5;
        const h = (0.05 + Math.random() * 0.10) * (1 + l.speed * 4);
        const w = h * 0.5;
        const topY = l.baseY + 0.02 + Math.sin(x / W * TWO_PI * 2) * l.amp;
        const ph = x * 1.7 + i * 0.6;
        positions.push(x, topY + h, 0,  x - w, topY, 0,  x + w, topY, 0);
        sway.push(1, 0, 0);
        phase.push(ph, ph, ph);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      g.setAttribute('aSway',  new THREE.Float32BufferAttribute(sway, 1));
      g.setAttribute('aPhase', new THREE.Float32BufferAttribute(phase, 1));
      const idx: number[] = [];
      for (let i = 0; i < positions.length / 9; i++) idx.push(i * 3, i * 3 + 1, i * 3 + 2);
      g.setIndex(idx);
      const windAmp = 0.006 + l.speed * 0.20;
      const m = new THREE.ShaderMaterial({
        transparent: l.opacity < 1, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(l.color) }, uOpacity: { value: l.opacity }, uAmp: { value: windAmp } },
        vertexShader: `
          attribute float aSway; attribute float aPhase;
          uniform float uTime; uniform float uAmp;
          void main(){
            vec3 p = position;
            float w = sin(uTime * 1.1 + aPhase) * 0.7 + sin(uTime * 2.3 + aPhase * 1.7) * 0.3;
            p.x += aSway * w * uAmp;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `uniform vec3 uColor; uniform float uOpacity; void main(){ gl_FragColor = vec4(uColor, uOpacity); }`,
      });
      const pMesh = new THREE.Mesh(g, m); pMesh.renderOrder = baseRender + Math.round(l.speed * 100) + 1;
      grp.add(pMesh);
      updaters.push((t) => { m.uniforms.uTime.value = t; });
    }

    function addStars(intensity: number) {
      const N = Math.round(260 * intensity);
      const pos = new Float32Array(N * 3), ph = new Float32Array(N), sz = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        pos[i * 3]     = (Math.random() * 2 - 1) * aspect * 1.1;
        pos[i * 3 + 1] = M.horizon + Math.random() * (1 - M.horizon) + 0.05;
        pos[i * 3 + 2] = 0;
        ph[i] = Math.random() * TWO_PI;
        sz[i] = Math.random() * 2 + 0.6;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aPhase', new THREE.Float32BufferAttribute(ph, 1));
      g.setAttribute('aSize', new THREE.Float32BufferAttribute(sz, 1));
      const m = new THREE.ShaderMaterial({
        transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uDpr: { value: dpr }, uInt: { value: intensity } },
        vertexShader: `attribute float aPhase;attribute float aSize;uniform float uTime,uDpr;varying float vA;void main(){float tw=0.5+0.5*sin(uTime*0.8+aPhase);vA=0.3+0.7*tw;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*uDpr*(0.6+0.5*tw);}`,
        fragmentShader: `uniform float uInt;varying float vA;void main(){float d=length(gl_PointCoord-0.5)*2.0;if(d>1.0)discard;gl_FragColor=vec4(0.97,0.95,0.9,vA*uInt*(1.0-smoothstep(0.0,1.0,d)));}`,
      });
      const pts = new THREE.Points(g, m); pts.renderOrder = -65; dyn.add(pts);
      updaters.push((t) => { m.uniforms.uTime.value = t; });
    }

    function addFireflies() {
      const N = 50;
      const data: Array<{ ox: number; oy: number; spd: number; amp: number; phase: number }> = [];
      const pos = new Float32Array(N * 3), ph = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const x = (Math.random() * 2 - 1) * aspect * 1.1;
        const y = M.horizon - 0.05 + Math.random() * 0.5;
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = 0;
        ph[i] = Math.random() * TWO_PI;
        data.push({ ox: x, oy: y, spd: 0.2 + Math.random() * 0.4, amp: 0.04 + Math.random() * 0.06, phase: ph[i] });
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aPhase', new THREE.Float32BufferAttribute(ph, 1));
      const m = new THREE.ShaderMaterial({
        transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uDpr: { value: dpr } },
        vertexShader: `attribute float aPhase;uniform float uTime,uDpr;varying float vA;void main(){float b=0.5+0.5*sin(uTime*1.8+aPhase);vA=pow(b,2.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=(3.0+3.0*b)*uDpr;}`,
        fragmentShader: `varying float vA;void main(){float d=length(gl_PointCoord-0.5)*2.0;if(d>1.0)discard;vec3 c=mix(vec3(1.0,0.85,0.3),vec3(0.95,0.55,0.1),d);gl_FragColor=vec4(c,vA*(1.0-smoothstep(0.0,1.0,d)));}`,
      });
      const pts = new THREE.Points(g, m); pts.renderOrder = -45; dyn.add(pts);
      const attr = g.attributes.position;
      updaters.push((t) => {
        m.uniforms.uTime.value = t;
        data.forEach((f, i) => {
          attr.setXYZ(i, f.ox + Math.sin(t * f.spd + f.phase) * f.amp * 1.4, f.oy + Math.sin(t * f.spd * 0.6 + f.phase + 1.2) * f.amp, 0);
        });
        (attr as THREE.BufferAttribute).needsUpdate = true;
      });
    }

    function addGulls(n: number) {
      const gulls: Array<{ line: THREE.Line; ox: number; oy: number; spd: number; phase: number; flap: number; sx: number }> = [];
      for (let i = 0; i < n; i++) {
        const pts = [new THREE.Vector3(-0.04, 0, 0), new THREE.Vector3(0, 0.018, 0), new THREE.Vector3(0.04, 0, 0)];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: '#1a0d28', transparent: true, opacity: 0.8, depthTest: false });
        const line = new THREE.Line(geo, mat);
        const ox = (Math.random() * 2 - 1) * aspect, oy = 0.25 + Math.random() * 0.4;
        line.position.set(ox, oy, 0); line.renderOrder = -55;
        const s = 0.7 + Math.random() * 0.8; line.scale.setScalar(s);
        dyn.add(line);
        gulls.push({ line, ox, oy, spd: 0.03 + Math.random() * 0.04, phase: Math.random() * TWO_PI, flap: 1.5 + Math.random() * 1.5, sx: s });
      }
      updaters.push((t, dt) => {
        gulls.forEach((g) => {
          g.line.position.x -= g.spd * (isStatic ? 0.3 : 1) * dt * 0.9;
          if (g.line.position.x < -aspect * 1.2) g.line.position.x = aspect * 1.2;
          g.line.position.y = g.oy + Math.sin(t * 0.5 + g.phase) * 0.03;
          const f = 0.5 + 0.5 * Math.abs(Math.sin(t * g.flap + g.phase));
          g.line.scale.set(g.sx, g.sx * (0.4 + 0.6 * f), 1);
        });
      });
    }

    function addShootingStar() {
      const mat = new THREE.SpriteMaterial({ map: glowTex, color: '#ffffff', transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
      const sp = new THREE.Sprite(mat); sp.scale.set(0.5, 0.05, 1); sp.renderOrder = -64; dyn.add(sp);
      let next = 4 + Math.random() * 8, active = false, x0 = 0, y0 = 0, t0 = 0;
      updaters.push((t) => {
        if (!active && t > next) { active = true; t0 = t; x0 = (Math.random() * 0.6 + 0.1) * aspect; y0 = 0.5 + Math.random() * 0.4; }
        if (active) {
          const p = (t - t0) / 0.7;
          sp.position.set(x0 - p * 0.9 * aspect, y0 - p * 0.4, 0);
          mat.opacity = p < 0.2 ? p / 0.2 : (p > 0.7 ? (1 - p) / 0.3 : 1);
          if (p >= 1) { active = false; mat.opacity = 0; next = t + 12 + Math.random() * 16; }
        }
      });
    }

    function addMotes() {
      const N = 34;
      const pos = new Float32Array(N * 3), ph = new Float32Array(N);
      const data: Array<{ ox: number; oy: number; spd: number; amp: number; phase: number }> = [];
      for (let i = 0; i < N; i++) {
        const x = (Math.random() * 2 - 1) * aspect;
        const y = M.horizon - 0.05 + Math.random() * 0.45;
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = 0;
        ph[i] = Math.random() * TWO_PI;
        data.push({ ox: x, oy: y, spd: 0.1 + Math.random() * 0.25, amp: 0.03 + Math.random() * 0.05, phase: ph[i] });
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aPhase', new THREE.Float32BufferAttribute(ph, 1));
      const m = new THREE.ShaderMaterial({
        transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uDpr: { value: dpr } },
        vertexShader: `attribute float aPhase;uniform float uTime,uDpr;varying float vA;void main(){float b=0.5+0.5*sin(uTime*0.9+aPhase);vA=b*0.4;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=(2.0+2.0*b)*uDpr;}`,
        fragmentShader: `varying float vA;void main(){float d=length(gl_PointCoord-0.5)*2.0;if(d>1.0)discard;gl_FragColor=vec4(1.0,0.95,0.7,vA*(1.0-d));}`,
      });
      const pts = new THREE.Points(g, m); pts.renderOrder = -44; dyn.add(pts);
      const attr = g.attributes.position;
      updaters.push((t) => {
        m.uniforms.uTime.value = t;
        data.forEach((f, i) => {
          attr.setXYZ(i, f.ox + Math.sin(t * f.spd + f.phase) * f.amp, f.oy + Math.cos(t * f.spd * 0.7 + f.phase) * f.amp * 0.7, 0);
        });
        (attr as THREE.BufferAttribute).needsUpdate = true;
      });
    }

    curKey = key;
  }

  // ─── Moment switch with crossfade ─────────────────────────────────────────────

  let tween: { t: number; dur: number; from: THREE.Color[]; to: THREE.Color[]; key: SkyMomentKey; swapped: boolean } | null = null;

  function setMoment(key: SkyMomentKey, instant?: boolean) {
    if (!MOMENTS[key]) return;
    const M = MOMENTS[key];
    const targetColors = M.sky.map((h) => new THREE.Color(h));
    if (instant || !curKey) {
      skyUniforms.uColors.value.forEach((c, i) => c.copy(targetColors[i]));
      build(key);
      return;
    }
    const fadeCol = new THREE.Color(M.sky[M.sky.length - 2]);
    fadeMat.color.copy(fadeCol);
    const fromColors = skyUniforms.uColors.value.map((c) => c.clone());
    tween = { t: 0, dur: 0.7, from: fromColors, to: targetColors, key, swapped: false };
  }

  // ─── Animation loop ───────────────────────────────────────────────────────────

  const clock = new THREE.Clock();
  let animId: number, last = 0;

  function tick() {
    animId = requestAnimationFrame(tick);
    const t = clock.getElapsedTime();
    const dt = Math.min(t - last, 0.05); last = t;

    if (tween) {
      tween.t += dt;
      const raw = Math.min(tween.t / tween.dur, 1);
      const p = emphasized(raw);
      fadeMat.opacity = raw < 0.5 ? (raw / 0.5) : (1 - (raw - 0.5) / 0.5);
      skyUniforms.uColors.value.forEach((c, i) => c.copy(tween!.from[i]).lerp(tween!.to[i], p));
      if (raw >= 0.5 && !tween.swapped) {
        try { build(tween.key); } catch (e) { console.error('sky-engine build error:', e); }
        tween.swapped = true;
      }
      if (raw >= 1) { fadeMat.opacity = 0; tween = null; }
    }

    for (let i = 0; i < updaters.length; i++) {
      try { updaters[i](t, dt); } catch (e) { /* ignore per-frame errors */ }
    }
    renderer.render(scene, cam);
  }
  tick();

  // ─── Resize ───────────────────────────────────────────────────────────────────

  function onResize() {
    aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    cam.left = -aspect; cam.right = aspect; cam.updateProjectionMatrix();
    fadeMesh.scale.set(aspect, 1, 1);
    if (curKey) build(curKey);
  }
  window.addEventListener('resize', onResize);
  fadeMesh.scale.set(aspect, 1, 1);

  // Init
  setMoment((opts?.moment) || 'night', true);

  return {
    setMoment: (k) => setMoment(k),
    getMoment: () => curKey,
    destroy() {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      try { renderer.forceContextLoss(); } catch (e) { /* ignore */ }
      renderer.dispose();
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const SkyEngine = {
  MOMENTS,
  init(canvas: HTMLCanvasElement, opts?: SkyEngineOpts): SkyEngineCtrl {
    return create(canvas, opts);
  },
};
