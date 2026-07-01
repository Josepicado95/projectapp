import * as THREE from 'three';

const TWO_PI = Math.PI * 2;

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Layer {
  type: 'mtn' | 'hill' | 'trees' | 'fg';
  color: string;
  baseY: number;
  amp: number;
  jag: number;
  speed: number;
  opacity: number;
  snow: string | null;
  snowDepth: number;
  snowOpacity: number;
}

interface AuroraBand { y: number; w: number; h: number; c1: string; c2: string; spd: number; op: number; }
interface CliffCfg   { side: number; color: string; pineColor: string; grass: string; topY: number; tipX: number; outerX: number; pines: number; }
interface WaterCfg   { top: string; deep: string; reflect: string; }
interface GrassCfg   { color: string; count: number; y: number; h: number; opacity: number; }
interface LeafCfg    { colors: string[]; count: number; size: number; }
interface FlowerCfg  { colors: string[]; count: number; size: number; yTop: number; yBot: number; }

interface MomentDef {
  sky: string[];
  horizon: number;
  celestial: { x: number; y: number; r: number; core: string; glow: string; glow2: string; isMoon: boolean };
  clouds: { tints: string[]; count: number; yMin: number; yMax: number; opacity: number; scale: number; streaky: boolean };
  water: WaterCfg | null;
  ground: string | null;
  layers: Layer[];
  cliff: CliffCfg | null;
  aurora: { bands: AuroraBand[] } | null;
  stars: number;
  gulls: number;
  shootingStars: boolean;
  motes: boolean;
  snow: boolean;
  leaves: LeafCfg | null;
  grass: GrassCfg | null;
  flowers: FlowerCfg | null;
  butterflies: number;
}

// ─── Moment definitions ───────────────────────────────────────────────────────

const MOMENTS: Record<SkyMomentKey, MomentDef> = {
  dawn: {
    sky: ['#A6C2CC','#B4CDD4','#C4D7DA','#D4E0DF','#E2EAE4','#EFF2EA'],
    horizon: -0.06,
    celestial: { x:0.18, y:0.70, r:0.046, core:'#FBF4E2', glow:'#F2E8CE', glow2:'#EADFC0', isMoon:false },
    clouds: { tints:['#FFFFFF','#FBFCFA','#EFF3EF'], count:5, yMin:0.56, yMax:0.84, opacity:0.9, scale:1.5, streaky:true },
    water: null, ground: '#D9A82E',
    layers: [
      { type:'mtn',  color:'#9FB6C0', baseY:-0.01, amp:0.06, jag:0.02, speed:0.005, opacity:1, snow:null, snowDepth:0, snowOpacity:0 },
      { type:'mtn',  color:'#88A6B2', baseY:-0.06, amp:0.05, jag:0.02, speed:0.009, opacity:1, snow:null, snowDepth:0, snowOpacity:0 },
      { type:'hill', color:'#E3BC46', baseY:-0.16, amp:0.09, jag:0.0,  speed:0.016, opacity:1, snow:null, snowDepth:0, snowOpacity:0 },
      { type:'hill', color:'#D9A82E', baseY:-0.30, amp:0.11, jag:0.0,  speed:0.024, opacity:1, snow:null, snowDepth:0, snowOpacity:0 },
      { type:'fg',   color:'#C28E20', baseY:-0.62, amp:0.13, jag:0.0,  speed:0.034, opacity:1, snow:null, snowDepth:0, snowOpacity:0 },
    ],
    cliff: null, aurora: null,
    stars:0, gulls:3, shootingStars:false, motes:false, snow:false,
    leaves: { colors:['#E3BC46','#C9962E','#EAD27A','#D9A82E'], count:22, size:6 },
    grass:  { color:'#B98C22', count:110, y:-0.9, h:0.22, opacity:0.96 },
    flowers: null, butterflies: 0,
  },
  noon: {
    sky: ['#57A6CE','#75BAD8','#92CBDF','#B3DAE6','#D4EAEE','#EBF6F1'],
    horizon: -0.05,
    celestial: { x:0.24, y:0.72, r:0.052, core:'#FFFDF4', glow:'#FCF3D8', glow2:'#F7EAC6', isMoon:false },
    clouds: { tints:['#FFFFFF','#FBFEFE','#EDF6F6'], count:8, yMin:0.56, yMax:0.9, opacity:0.96, scale:1.75, streaky:false },
    water: null, ground: '#6EA430',
    layers: [
      { type:'hill', color:'#B2D46C', baseY: 0.00, amp:0.08, jag:0.0, speed:0.007, opacity:1, snow:null, snowDepth:0, snowOpacity:0 },
      { type:'hill', color:'#96C650', baseY:-0.08, amp:0.11, jag:0.0, speed:0.012, opacity:1, snow:null, snowDepth:0, snowOpacity:0 },
      { type:'hill', color:'#78AC3A', baseY:-0.18, amp:0.12, jag:0.0, speed:0.019, opacity:1, snow:null, snowDepth:0, snowOpacity:0 },
      { type:'hill', color:'#5D922E', baseY:-0.34, amp:0.13, jag:0.0, speed:0.028, opacity:1, snow:null, snowDepth:0, snowOpacity:0 },
    ],
    cliff: null, aurora: null,
    stars:0, gulls:0, shootingStars:false, motes:true, snow:false,
    leaves: null,
    grass:   { color:'#3E6E1E', count:210, y:-0.9, h:0.2, opacity:1 },
    flowers: { colors:['#FFFFFF','#F5D64E','#F2A0C4','#E86E9A','#FFF0A0','#C89CF0'], count:80, size:7, yTop:-0.28, yBot:-0.88 },
    butterflies: 6,
  },
  dusk: {
    sky: ['#3A3A70','#6A5488','#A66C86','#D89072','#F2B468','#F9D888'],
    horizon: -0.02,
    celestial: { x:0.32, y:0.14, r:0.075, core:'#FFF2C8', glow:'#FCC878', glow2:'#F2A050', isMoon:false },
    clouds: { tints:['#FBD9A8','#F2B488','#E0967E'], count:6, yMin:0.30, yMax:0.62, opacity:0.72, scale:1.7, streaky:true },
    water: { top:'#F0C070', deep:'#6E5478', reflect:'#FFE2A2' }, ground: null,
    layers: [] as Layer[],
    cliff: { side:1, color:'#241A2A', pineColor:'#1A1220', grass:'#3A2C3E', topY:0.13, tipX:0.03, outerX:1.35, pines:4 },
    aurora: null,
    stars:0, gulls:3, shootingStars:false, motes:false, snow:false,
    leaves: { colors:['#E7B070','#D89060','#C87850'], count:12, size:5 },
    grass: null, flowers: null, butterflies: 0,
  },
  night: {
    sky: ['#070E28','#0C1636','#122048','#182A5A','#20386E','#2C4884'],
    horizon: -0.06,
    celestial: { x:0.68, y:0.76, r:0.05, core:'#EAF0F2', glow:'#C6D8DE', glow2:'#A4C0CC', isMoon:true },
    clouds: { tints:['#1C2A4A'], count:0, yMin:0.5, yMax:0.66, opacity:0.3, scale:1.4, streaky:true },
    water: null, ground: '#0A1424',
    layers: [
      { type:'mtn',   color:'#20304E', baseY: 0.08, amp:0.32, jag:0.11, speed:0.005, opacity:1, snow:'#C6D4E6', snowDepth:0.050, snowOpacity:0.92 },
      { type:'mtn',   color:'#152038', baseY:-0.05, amp:0.26, jag:0.10, speed:0.009, opacity:1, snow:'#9EB2CC', snowDepth:0.045, snowOpacity:0.82 },
      { type:'trees', color:'#070E1C', baseY:-0.42, amp:0.00, jag:0.00, speed:0.030, opacity:1, snow:null,      snowDepth:0,     snowOpacity:0    },
    ],
    cliff: null,
    aurora: { bands: [
      { y:0.66, w:2.7, h:0.56, c1:'#3FBF8A', c2:'#3A78C8', spd:0.26, op:0.55 },
      { y:0.77, w:2.4, h:0.46, c1:'#8FE0C0', c2:'#7A5CC8', spd:0.20, op:0.40 },
      { y:0.58, w:2.2, h:0.42, c1:'#57C88E', c2:'#2E86C0', spd:0.34, op:0.48 },
    ] },
    stars:1.0, gulls:0, shootingStars:true, motes:false, snow:true,
    leaves: null, grass: null, flowers: null, butterflies: 0,
  },
};

// ─── Texture factories ────────────────────────────────────────────────────────

function makeStreakTexture(): THREE.CanvasTexture {
  const W = 512, H = 256;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.globalCompositeOperation = 'lighter';
  const streak = (x: number, y: number, rx: number, ry: number, peak: number) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0,0,0,0,0,1);
    for (let s=0;s<=14;s++){const u=s/14;g.addColorStop(u,`rgba(255,255,255,${(peak*Math.exp(-u*u*3.2)).toFixed(4)})`);}
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,1,0,Math.PI*2); ctx.fill(); ctx.restore();
  };
  const cy = H/2;
  streak(W*0.50,cy,210,26,0.40); streak(W*0.32,cy-6,150,18,0.34);
  streak(W*0.68,cy+4,160,20,0.34); streak(W*0.20,cy+8,100,14,0.26); streak(W*0.80,cy-8,100,14,0.26);
  ctx.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  return tex;
}

function makeCloudTexture(): THREE.CanvasTexture {
  const S = 512; const c = document.createElement('canvas'); c.width = S; c.height = S/2;
  const ctx = c.getContext('2d')!; const cx = S/2, cy = S/4;
  ctx.globalCompositeOperation = 'lighter';
  const blob = (x:number,y:number,r:number,peak:number) => {
    const g = ctx.createRadialGradient(x,y,0,x,y,r);
    for(let s=0;s<=16;s++){const u=s/16;const a=peak*Math.exp(-u*u*3.0);g.addColorStop(u,`rgba(255,255,255,${a.toFixed(4)})`);}
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  };
  blob(cx,cy+6,150,0.34); blob(cx-95,cy+14,100,0.30); blob(cx+100,cy+16,104,0.30);
  blob(cx-38,cy-16,88,0.30); blob(cx+52,cy-12,84,0.30); blob(cx+6,cy-34,66,0.26);
  blob(cx-158,cy+22,62,0.22); blob(cx+164,cy+24,62,0.22);
  blob(cx-70,cy+30,70,0.20); blob(cx+80,cy+30,70,0.20);
  ctx.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  return tex;
}

function makeGlowTexture(): THREE.CanvasTexture {
  const S = 256; const c = document.createElement('canvas'); c.width = S; c.height = S;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  for(let s=0;s<=32;s++){const u=s/32;const a=Math.exp(-u*u*5.0);g.addColorStop(u,`rgba(255,255,255,${a.toFixed(4)})`);}
  ctx.fillStyle = g; ctx.fillRect(0,0,S,S);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  return tex;
}

// ─── Easing ───────────────────────────────────────────────────────────────────

function emphasized(x: number): number {
  const cx=3*0.2, bx=3*(0-0.2)-cx, ax=1-cx-bx;
  const cy=3*0.0, by=3*(1-0.0)-cy, ay=1-cy-by;
  let t = x;
  for(let i=0;i<5;i++){const fx=((ax*t+bx)*t+cx)*t-x;const d=(3*ax*t+2*bx)*t+cx;if(Math.abs(d)<1e-5)break;t-=fx/d;}
  return ((ay*t+by)*t+cy)*t;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

function create(canvas: HTMLCanvasElement, opts?: SkyEngineOpts): SkyEngineCtrl {
  const isStatic = !!(opts?.static);
  let aspect = window.innerWidth / window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, preserveDrawingBuffer:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(dpr);
  renderer.autoClear = true;

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, -100, 100);
  cam.position.z = 10;

  const cloudTex = makeCloudTexture();
  const streakTex = makeStreakTexture();
  const glowTex = makeGlowTexture();

  function windAt(t: number): number {
    const g = 0.6 + 0.5*Math.sin(t*0.33) + 0.28*Math.sin(t*0.83+1.1) + 0.16*Math.sin(t*1.9+2.3);
    return Math.max(0.05, g);
  }

  const SKY_N = 6;
  const skyUniforms = {
    uColors: { value: Array.from({ length: SKY_N }, () => new THREE.Color('#000')) },
    uHorizon: { value: -0.1 },
  };
  const skyMesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2), new THREE.ShaderMaterial({
    depthTest:false, depthWrite:false,
    uniforms: skyUniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy*2.0,1.0,1.0); }`,
    fragmentShader: `
      precision highp float;
      uniform vec3 uColors[${SKY_N}];
      varying vec2 vUv;
      void main(){
        float t=clamp(vUv.y,0.0,1.0);
        float s=(1.0-t)*float(${SKY_N-1});
        int i=int(floor(s)); float f=fract(s);
        vec3 col=uColors[0];
        for(int k=0;k<${SKY_N-1};k++){ if(k==i){ col=mix(uColors[k],uColors[k+1],f); } }
        if(i>=${SKY_N-1}) col=uColors[${SKY_N-1}];
        gl_FragColor=vec4(col,1.0);
      }
    `,
  }));
  skyMesh.frustumCulled = false; skyMesh.renderOrder = -100; scene.add(skyMesh);

  let dyn = new THREE.Group(); scene.add(dyn);
  let updaters: Array<(t: number, dt: number) => void> = [];
  let curKey: SkyMomentKey | null = null;

  const fadeMat = new THREE.MeshBasicMaterial({ color:'#000', transparent:true, opacity:0, depthTest:false, depthWrite:false });
  const fadeMesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2), fadeMat);
  fadeMesh.frustumCulled = false; fadeMesh.renderOrder = 1000; scene.add(fadeMesh);

  // ─── Build ──────────────────────────────────────────────────────────────────

  function build(key: SkyMomentKey) {
    dyn.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        const ms = Array.isArray(m.material) ? m.material : [m.material];
        ms.forEach((x: THREE.Material) => x.dispose());
      }
    });
    scene.remove(dyn); dyn = new THREE.Group(); scene.add(dyn); updaters = [];

    const M = MOMENTS[key];
    const W = 2 * aspect;

    skyUniforms.uHorizon.value = M.horizon;

    // Ground / water
    if (M.water) {
      addWater(M.water);
    } else if (M.ground) {
      const mat = new THREE.MeshBasicMaterial({ color:M.ground, depthTest:false, depthWrite:false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W*4, 2.4), mat);
      mesh.position.y = M.horizon - 1.2; mesh.renderOrder = -90; dyn.add(mesh);
    }

    if (M.aurora)  addAurora(M.aurora.bands);
    addCelestial(M.celestial);
    M.layers.filter((l: Layer) => l.type==='mtn' || l.type==='hill').forEach((l: Layer) => addSilhouette(l, -50));
    addClouds(M.clouds);
    M.layers.filter((l: Layer) => l.type==='trees' || l.type==='fg').forEach((l: Layer) => addSilhouette(l, -40));
    if (M.cliff)   addCliff(M.cliff);

    if (M.stars > 0)    addStars(M.stars);
    if (M.gulls > 0)    addGulls(M.gulls);
    if (M.shootingStars) addShootingStar();
    if (M.motes)        addMotes();
    if (M.grass)        addGrass(M.grass);
    if (M.leaves)       addLeaves(M.leaves);
    if (M.snow)         addSnow();
    if (M.flowers)      addFlowers(M.flowers);
    if (M.butterflies)  addButterflies(M.butterflies);
    addWindStreaks();

    curKey = key;

    // ── Helpers ──────────────────────────────────────────────────────────────

    function addWater(cfg: WaterCfg) {
      const mat = new THREE.ShaderMaterial({
        depthTest:false, depthWrite:false,
        uniforms: {
          uTime:    { value: 0 },
          uTop:     { value: new THREE.Color(cfg.top) },
          uDeep:    { value: new THREE.Color(cfg.deep) },
          uRef:     { value: new THREE.Color(cfg.reflect) },
          uSunX:    { value: M.celestial.x },
          uHorizon: { value: M.horizon },
        },
        vertexShader: `varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `
          precision highp float;
          uniform float uTime;uniform vec3 uTop,uDeep,uRef;uniform float uSunX,uHorizon;
          varying vec2 vP;
          void main(){
            float d=clamp((uHorizon-vP.y)/(uHorizon+1.0),0.0,1.0);
            vec3 col=mix(uTop,uDeep,pow(d,0.8));
            float lane=smoothstep(0.18,0.0,abs(vP.x-uSunX*${aspect.toFixed(4)})-d*0.10);
            float shim=0.5+0.5*sin(vP.y*60.0+uTime*2.2)*sin(vP.x*14.0-uTime*1.4);
            col=mix(col,uRef,lane*(0.35+0.4*shim)*(1.0-d*0.5));
            col+=0.04*(0.5+0.5*sin(vP.x*30.0+uTime*1.6+vP.y*40.0))*(1.0-d);
            gl_FragColor=vec4(col,1.0);
          }
        `,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W*4, 2.4), mat);
      mesh.position.y = M.horizon - 1.2; mesh.renderOrder = -90; dyn.add(mesh);
      updaters.push(t => { mat.uniforms.uTime.value = t; });
    }

    function addCelestial(C: MomentDef['celestial']) {
      const grp = new THREE.Group();
      grp.position.set(C.x * aspect, C.y, 0);

      const g1 = new THREE.SpriteMaterial({ map:glowTex, color:new THREE.Color(C.glow),  transparent:true, opacity:0.9, depthTest:false, depthWrite:false, blending:THREE.AdditiveBlending });
      const g2 = new THREE.SpriteMaterial({ map:glowTex, color:new THREE.Color(C.glow2), transparent:true, opacity:0.7, depthTest:false, depthWrite:false, blending:THREE.AdditiveBlending });
      const s1 = new THREE.Sprite(g1); s1.scale.set(C.r*11, C.r*11, 1); s1.renderOrder = -70; grp.add(s1);
      const s2 = new THREE.Sprite(g2); s2.scale.set(C.r*6,  C.r*6,  1); s2.renderOrder = -69; grp.add(s2);

      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(C.r, 64),
        new THREE.MeshBasicMaterial({ color:new THREE.Color(C.core), transparent:true, depthTest:false, depthWrite:false }),
      );
      disc.renderOrder = -68; grp.add(disc);

      if (C.isMoon) {
        const cm = new THREE.MeshBasicMaterial({ color:'#dcd6c4', transparent:true, opacity:0.5, depthTest:false, depthWrite:false });
        ([ [-0.3,0.2,0.18], [0.25,0.3,0.13], [0.1,-0.35,0.16], [-0.15,-0.1,0.10] ] as [number,number,number][]).forEach(([cx,cy,cr]) => {
          const m2 = new THREE.Mesh(new THREE.CircleGeometry(C.r*cr, 24), cm);
          m2.position.set(C.r*cx, C.r*cy, 0.01); m2.renderOrder = -67; grp.add(m2);
        });
      }

      grp.renderOrder = -70; dyn.add(grp);
      updaters.push(t => { g1.opacity = 0.78 + 0.12*Math.sin(t*0.6); });
    }

    function addClouds(CL: MomentDef['clouds']) {
      if (CL.count === 0) return;
      const streaky = !!CL.streaky;
      const clouds: Array<{ sp:THREE.Sprite; y:number; spd:number; w:number; phase:number; bob:number }> = [];
      for (let i=0; i<CL.count; i++) {
        const tint = CL.tints[i % CL.tints.length];
        const mat = new THREE.SpriteMaterial({ map:streaky?streakTex:cloudTex, color:new THREE.Color(tint), transparent:true, opacity:CL.opacity, depthTest:false, depthWrite:false });
        const sp = new THREE.Sprite(mat);
        const sc = CL.scale * (0.6 + Math.random()*0.9);
        if (streaky) sp.scale.set(sc*3.0, sc*0.34, 1); else sp.scale.set(sc*1.7, sc*0.7, 1);
        const x0 = (Math.random()*2-1)*W;
        const y0 = CL.yMin + Math.random()*(CL.yMax-CL.yMin);
        sp.position.set(x0, y0, 0); sp.renderOrder = -60; dyn.add(sp);
        clouds.push({ sp, y:y0, spd:0.012+Math.random()*0.020, w:sc*1.7, phase:Math.random()*TWO_PI, bob:0.004+Math.random()*0.006 });
      }
      updaters.push((t, dt) => {
        clouds.forEach(c => {
          c.sp.position.x -= c.spd * (isStatic ? 0.3 : 1) * dt * 60 * 0.016;
          if (c.sp.position.x < -W - c.w) c.sp.position.x = W + c.w;
          c.sp.position.y = c.y + Math.sin(t*0.25 + c.phase) * c.bob;
        });
      });
    }

    function addSilhouette(l: Layer, baseRender: number) {
      const segs = 320, span = W*4;
      const freqs = [0.5,1,2,3,5], amps = [1.0,0.6,0.28,0.13,0.05];
      const phases = freqs.map(f => (f*1.7 + l.baseY*3.1) % TWO_PI);
      const ridgeY = (u: number) => {
        let y = l.baseY;
        for (let k=0;k<freqs.length;k++) y += l.amp*amps[k]*Math.sin(u*freqs[k]*Math.PI + phases[k]);
        if (l.jag) y += l.jag*0.5*Math.sin(u*3.0*TWO_PI + phases[0]);
        return y;
      };

      const shape = new THREE.Shape();
      shape.moveTo(-2*W, -2.2);
      for (let i=0;i<=segs;i++) { const x=-2*W+(i/segs)*span; shape.lineTo(x, ridgeY(x/W)); }
      shape.lineTo(2*W, -2.2);

      const mat = new THREE.MeshBasicMaterial({ color:new THREE.Color(l.color), transparent:l.opacity<1, opacity:l.opacity, depthTest:false, depthWrite:false });
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
      mesh.renderOrder = baseRender + Math.round(l.speed*100);

      const grp = new THREE.Group(); grp.add(mesh); dyn.add(grp);

      if (l.snow) {
        const cap = l.snowDepth;
        const s2 = new THREE.Shape();
        s2.moveTo(-2*W, ridgeY(-2));
        for (let i=0;i<=segs;i++) { const x=-2*W+(i/segs)*span; s2.lineTo(x, ridgeY(x/W)); }
        for (let i=segs;i>=0;i--) { const x=-2*W+(i/segs)*span; s2.lineTo(x, ridgeY(x/W) - cap*(0.6 + 0.4*Math.sin(x/W*5.0+1.0))); }
        const smat = new THREE.MeshBasicMaterial({ color:new THREE.Color(l.snow), transparent:true, opacity:l.snowOpacity, depthTest:false, depthWrite:false });
        const smesh = new THREE.Mesh(new THREE.ShapeGeometry(s2), smat);
        smesh.renderOrder = mesh.renderOrder + 0.5; grp.add(smesh);
      }

      if (l.type === 'trees') addPineRow(grp, l, baseRender);
      updaters.push(t => { grp.position.x = isStatic ? 0 : -((t*l.speed*W) % W); });
    }

    function addPineRow(grp: THREE.Group, l: Layer, baseRender: number) {
      const count = Math.round(64 / Math.max(0.5, l.speed*40));
      const step = (W*4) / count;
      const positions: number[] = [], sway: number[] = [], phase: number[] = [];

      const pushTri = (ax:number,ay:number,bx:number,by:number,cx2:number,cy2:number,sa:number,sb:number,sc:number,ph:number) => {
        positions.push(ax,ay,0,bx,by,0,cx2,cy2,0); sway.push(sa,sb,sc); phase.push(ph,ph,ph);
      };

      for (let i=0;i<=count;i++) {
        const x = -2*W + i*step + (Math.random()-0.5)*step*0.5;
        const h = (0.09 + Math.random()*0.15) * (1 + l.speed*5);
        const w = h * 0.34;
        const baseY = l.baseY + 0.01 + Math.sin(x/W*TWO_PI*2)*l.amp;
        const ph = x*1.7 + i*0.6;
        const sy = (yy: number) => Math.min(1, Math.max(0, (yy-baseY)/h));
        const tw = w*0.16, th = h*0.14;
        pushTri(x-tw,baseY,   x+tw,baseY,    x+tw,baseY+th, sy(baseY),sy(baseY),sy(baseY+th),ph);
        pushTri(x-tw,baseY,   x+tw,baseY+th, x-tw,baseY+th, sy(baseY),sy(baseY+th),sy(baseY+th),ph);
        const tiers: [number,number,number][] = [
          [baseY+th,      baseY+th+h*0.46, w     ],
          [baseY+h*0.30,  baseY+h*0.74,    w*0.74],
          [baseY+h*0.58,  baseY+h*1.02,    w*0.50],
        ];
        tiers.forEach(([by,ay,hw]) => pushTri(x-hw,by,x+hw,by,x,ay,sy(by),sy(by),sy(ay),ph));
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('aSway',    new THREE.Float32BufferAttribute(sway, 1));
      geo.setAttribute('aPhase',   new THREE.Float32BufferAttribute(phase, 1));

      const windAmp = 0.010 + l.speed*0.26;
      const mat = new THREE.ShaderMaterial({
        transparent:l.opacity<1, depthTest:false, depthWrite:false, side:THREE.DoubleSide,
        uniforms: { uTime:{value:0}, uWind:{value:0}, uColor:{value:new THREE.Color(l.color)}, uOpacity:{value:l.opacity}, uAmp:{value:windAmp} },
        vertexShader: `
          attribute float aSway;attribute float aPhase;
          uniform float uTime;uniform float uAmp;uniform float uWind;varying float vS;
          void main(){
            vec3 p=position;float s=clamp(aSway,0.0,1.0);vS=s;
            float w=sin(uTime*1.1+aPhase)*0.6+sin(uTime*2.4+aPhase*1.7)*0.4;
            p.x+=s*s*w*uAmp*(0.35+uWind);
            gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
          }
        `,
        fragmentShader: `uniform vec3 uColor;uniform float uOpacity;varying float vS;void main(){vec3 c=mix(uColor*0.9,uColor*1.16,vS);gl_FragColor=vec4(c,uOpacity);}`,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = baseRender + Math.round(l.speed*100) + 1;
      grp.add(mesh);
      updaters.push(t => { mat.uniforms.uTime.value = t; mat.uniforms.uWind.value = windAt(t); });
    }

    function addWindStreaks() {
      const N = 26;
      type Streak = { x:number; y:number; len:number; spd:number; a:number; yb:number };
      const data: Streak[] = [];
      const yRange = () => M.horizon + 0.06 + Math.random()*(1-M.horizon)*0.82;
      for (let i=0;i<N;i++) {
        data.push({ x:(Math.random()*2-1)*aspect*1.4, y:yRange(), len:0.14+Math.random()*0.42, spd:0.5+Math.random()*0.8, a:0.05+Math.random()*0.09, yb:Math.random()*TWO_PI });
      }
      const posArr = new Float32Array(N*6), alphaArr = new Float32Array(N*2);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
      geo.setAttribute('aA',       new THREE.Float32BufferAttribute(alphaArr, 1));
      const mat = new THREE.ShaderMaterial({
        transparent:true, blending:THREE.AdditiveBlending, depthTest:false, depthWrite:false,
        vertexShader:   `attribute float aA;varying float vA;void main(){vA=aA;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `varying float vA;void main(){gl_FragColor=vec4(1.0,1.0,1.0,vA);}`,
      });
      const seg = new THREE.LineSegments(geo, mat);
      seg.renderOrder = -58; dyn.add(seg);

      const pAttr = geo.attributes.position as THREE.BufferAttribute;
      const aAttr = geo.attributes.aA       as THREE.BufferAttribute;
      updaters.push((t, dt) => {
        const wind = windAt(t);
        data.forEach((s, i) => {
          s.x -= s.spd * (0.25+wind) * dt * (isStatic ? 0.5 : 1);
          if (s.x < -aspect*1.5) { s.x = aspect*1.5; s.y = yRange(); }
          const yy = s.y + Math.sin(t*0.8 + s.yb)*0.015;
          pAttr.setXYZ(i*2,   s.x, yy, 0);
          pAttr.setXYZ(i*2+1, s.x - s.len*(0.5+wind*0.6), yy-0.006, 0);
          aAttr.setX(i*2,   s.a * Math.min(1, wind));
          aAttr.setX(i*2+1, 0);
        });
        pAttr.needsUpdate = true; aAttr.needsUpdate = true;
      });
    }

    function addLeaves(cfg: LeafCfg) {
      const N = cfg.count;
      const pos = new Float32Array(N*3), ph = new Float32Array(N), cc = new Float32Array(N*3), sz = new Float32Array(N);
      const data: Array<{ y0:number; spd:number; amp:number; phase:number }> = [];
      for (let i=0;i<N;i++) {
        const x = (Math.random()*2-1)*aspect*1.3;
        const y = M.horizon - 0.02 + Math.random()*(1-M.horizon)*0.9;
        pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=0; ph[i]=Math.random()*TWO_PI;
        const col = new THREE.Color(cfg.colors[i % cfg.colors.length]);
        cc[i*3]=col.r; cc[i*3+1]=col.g; cc[i*3+2]=col.b;
        sz[i] = cfg.size * (0.6 + Math.random()*0.9);
        data.push({ y0:y, spd:0.25+Math.random()*0.4, amp:0.05+Math.random()*0.09, phase:ph[i] });
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('aPhase',   new THREE.Float32BufferAttribute(ph, 1));
      geo.setAttribute('aCol',     new THREE.Float32BufferAttribute(cc, 3));
      geo.setAttribute('aSize',    new THREE.Float32BufferAttribute(sz, 1));
      const mat = new THREE.ShaderMaterial({
        transparent:true, depthTest:false, depthWrite:false,
        uniforms: { uDpr:{value:dpr}, uTime:{value:0} },
        vertexShader:   `attribute float aPhase;attribute vec3 aCol;attribute float aSize;uniform float uDpr,uTime;varying vec3 vC;varying float vR;void main(){vC=aCol;vR=uTime*3.0+aPhase;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*uDpr;}`,
        fragmentShader: `varying vec3 vC;varying float vR;void main(){vec2 p=gl_PointCoord-0.5;float c=cos(vR),s=sin(vR);p=mat2(c,-s,s,c)*p;float d=abs(p.x)*2.4+abs(p.y)*1.2;if(d>1.0)discard;gl_FragColor=vec4(vC,(1.0-d)*0.9);}`,
      });
      const pts = new THREE.Points(geo, mat);
      pts.renderOrder = -36; dyn.add(pts);
      const pAttr = geo.attributes.position as THREE.BufferAttribute;
      updaters.push((t, dt) => {
        mat.uniforms.uTime.value = t;
        const wind = windAt(t);
        data.forEach((f, i) => {
          let x = pAttr.getX(i) - f.spd*(0.35+wind)*dt*(isStatic ? 0.4 : 1);
          if (x < -aspect*1.4) x = aspect*1.4;
          const y = f.y0 + Math.sin(t*f.spd*1.6+f.phase)*f.amp + Math.sin(t*0.9+f.phase*1.7)*f.amp*0.4;
          pAttr.setXYZ(i, x, y, 0);
        });
        pAttr.needsUpdate = true;
      });
    }

    function addGrass(cfg: GrassCfg) {
      const positions: number[] = [], sway: number[] = [], phase: number[] = [];
      for (let i=0;i<cfg.count;i++) {
        const x = -aspect*1.2 + (i/cfg.count)*aspect*2.4 + (Math.random()-0.5)*0.02;
        const h = cfg.h * (0.5 + Math.random()*0.9);
        const w = h*0.05 + 0.004;
        const by = cfg.y + (Math.random()-0.5)*0.05;
        const lean = (Math.random()-0.5)*w*2.5;
        const ph = x*3.0 + i*0.7;
        positions.push(x-w,by,0, x+w,by,0, x+lean,by+h,0);
        sway.push(0,0,1); phase.push(ph,ph,ph);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('aSway',    new THREE.Float32BufferAttribute(sway, 1));
      geo.setAttribute('aPhase',   new THREE.Float32BufferAttribute(phase, 1));
      const mat = new THREE.ShaderMaterial({
        transparent:cfg.opacity<1, depthTest:false, depthWrite:false, side:THREE.DoubleSide,
        uniforms: { uTime:{value:0}, uWind:{value:0}, uColor:{value:new THREE.Color(cfg.color)}, uOp:{value:cfg.opacity} },
        vertexShader:   `attribute float aSway;attribute float aPhase;uniform float uTime,uWind;void main(){vec3 p=position;float w=sin(uTime*1.3+aPhase)*0.6+sin(uTime*2.7+aPhase*1.6)*0.4;p.x+=aSway*w*(0.03+uWind*0.045);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
        fragmentShader: `uniform vec3 uColor;uniform float uOp;void main(){gl_FragColor=vec4(uColor,uOp);}`,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = -35; dyn.add(mesh);
      updaters.push(t => { mat.uniforms.uTime.value = t; mat.uniforms.uWind.value = windAt(t); });
    }

    function addAurora(bands: AuroraBand[]) {
      bands.forEach((b, bi) => {
        const mat = new THREE.ShaderMaterial({
          transparent:true, blending:THREE.AdditiveBlending, depthTest:false, depthWrite:false, side:THREE.DoubleSide,
          uniforms: { uTime:{value:0}, uC1:{value:new THREE.Color(b.c1)}, uC2:{value:new THREE.Color(b.c2)}, uSpd:{value:b.spd}, uOp:{value:b.op}, uOff:{value:bi*2.3} },
          vertexShader:   `uniform float uTime,uSpd,uOff;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;float x=p.x;p.y+=sin(x*2.2+uTime*uSpd+uOff)*0.06+sin(x*5.0+uTime*uSpd*1.6+uOff)*0.03+cos(x*9.0+uTime*uSpd*0.8)*0.015;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
          fragmentShader: `uniform vec3 uC1,uC2;uniform float uOp;varying vec2 vUv;void main(){float xM=sin(vUv.x*3.14159);float yF=1.0-pow(abs(vUv.y-0.5)*2.0,1.5);float ray=0.68+0.32*sin(vUv.x*44.0);float a=xM*max(0.0,yF)*uOp*ray;gl_FragColor=vec4(mix(uC1,uC2,smoothstep(0.1,0.9,vUv.x)),a);}`,
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(b.w*aspect, b.h, 130, 1), mat);
        mesh.position.set((Math.random()*0.4-0.2)*aspect, b.y, 0); mesh.renderOrder = -80; dyn.add(mesh);
        updaters.push(t => { mat.uniforms.uTime.value = t; });
      });
    }

    function addSnow() {
      const N = 100;
      const pos = new Float32Array(N*3), ph = new Float32Array(N), sz = new Float32Array(N);
      const data: Array<{ x:number; y:number; fall:number; amp:number; phase:number }> = [];
      for (let i=0;i<N;i++) {
        const x = (Math.random()*2-1)*aspect*1.3;
        const y = M.horizon + Math.random()*(1-M.horizon+0.2);
        pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=0; ph[i]=Math.random()*TWO_PI; sz[i]=1.4+Math.random()*2.6;
        data.push({ x, y, fall:0.03+Math.random()*0.05, amp:0.02+Math.random()*0.04, phase:ph[i] });
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('aPhase',   new THREE.Float32BufferAttribute(ph, 1));
      geo.setAttribute('aSize',    new THREE.Float32BufferAttribute(sz, 1));
      const mat = new THREE.ShaderMaterial({
        transparent:true, depthTest:false, depthWrite:false,
        uniforms: { uDpr:{value:dpr}, uTime:{value:0} },
        vertexShader:   `attribute float aPhase;attribute float aSize;uniform float uDpr,uTime;varying float vA;void main(){vA=0.6+0.4*sin(uTime*1.5+aPhase);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*uDpr;}`,
        fragmentShader: `varying float vA;void main(){float d=length(gl_PointCoord-0.5)*2.0;if(d>1.0)discard;gl_FragColor=vec4(0.93,0.97,1.0,vA*(1.0-d));}`,
      });
      const pts = new THREE.Points(geo, mat);
      pts.renderOrder = -34; dyn.add(pts);
      const pAttr = geo.attributes.position as THREE.BufferAttribute;
      updaters.push((t, dt) => {
        mat.uniforms.uTime.value = t;
        const wind = windAt(t);
        data.forEach((f, i) => {
          f.y -= f.fall * dt * (isStatic ? 0.5 : 1);
          f.x -= (0.04 + wind*0.08) * dt * (isStatic ? 0.4 : 1);
          if (f.y < M.horizon-0.15) { f.y = 1.05; f.x = (Math.random()*2-1)*aspect*1.3; }
          if (f.x < -aspect*1.4) f.x = aspect*1.4;
          pAttr.setXYZ(i, f.x + Math.sin(t*0.8+f.phase)*f.amp, f.y, 0);
        });
        pAttr.needsUpdate = true;
      });
    }

    function addCliff(cfg: CliffCfg) {
      const side = cfg.side;
      const outerX = cfg.outerX * aspect * side;
      const tipX   = cfg.tipX   * aspect * side;
      const topY   = cfg.topY;
      const N = 48;
      const topEdge: [number,number][] = [];

      const shape = new THREE.Shape();
      shape.moveTo(outerX, -1.3); shape.lineTo(outerX, topY);
      for (let i=0;i<=N;i++) {
        const tt = i/N, e = tt*tt*(3-2*tt);
        const x = outerX + (tipX-outerX)*tt;
        const y = topY + (M.horizon+0.02-topY)*e + Math.sin(tt*7.0+side)*0.015*(1-e);
        shape.lineTo(x, y); topEdge.push([x, y]);
      }
      shape.lineTo(tipX + 0.03*side, M.horizon-0.5); shape.lineTo(outerX, -1.3);

      const mesh = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({ color:new THREE.Color(cfg.color), depthTest:false, depthWrite:false }),
      );
      mesh.renderOrder = -33; dyn.add(mesh);

      const s2 = new THREE.Shape();
      s2.moveTo(topEdge[0][0], topEdge[0][1]);
      for (let i=0;i<topEdge.length;i++) s2.lineTo(topEdge[i][0], topEdge[i][1]);
      for (let i=topEdge.length-1;i>=0;i--) s2.lineTo(topEdge[i][0], topEdge[i][1]-0.045);
      const smesh = new THREE.Mesh(
        new THREE.ShapeGeometry(s2),
        new THREE.MeshBasicMaterial({ color:new THREE.Color(cfg.grass), depthTest:false, depthWrite:false }),
      );
      smesh.renderOrder = -32.5; dyn.add(smesh);

      const positions: number[] = [], sway: number[] = [], phase: number[] = [];
      for (let p=0;p<cfg.pines;p++) {
        const tt = 0.32 + (p/Math.max(1,cfg.pines))*0.5 + Math.random()*0.05;
        const idx = Math.min(topEdge.length-1, Math.round(tt*(topEdge.length-1)));
        const px = topEdge[idx][0], baseY = topEdge[idx][1]-0.005;
        const h = 0.12 + Math.random()*0.06, w = h*0.32, ph = px*2.0+p;
        const sy = (yy: number) => Math.min(1, Math.max(0, (yy-baseY)/h));
        ([[baseY,baseY+h*0.50,w],[baseY+h*0.28,baseY+h*0.78,w*0.72],[baseY+h*0.56,baseY+h*1.04,w*0.48]] as [number,number,number][])
          .forEach(([by,ay,hw]) => { positions.push(px-hw,by,0,px+hw,by,0,px,ay,0); sway.push(sy(by),sy(by),sy(ay)); phase.push(ph,ph,ph); });
      }
      if (positions.length) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('aSway',    new THREE.Float32BufferAttribute(sway, 1));
        geo.setAttribute('aPhase',   new THREE.Float32BufferAttribute(phase, 1));
        const mat = new THREE.ShaderMaterial({
          depthTest:false, depthWrite:false, side:THREE.DoubleSide,
          uniforms: { uTime:{value:0}, uWind:{value:0}, uColor:{value:new THREE.Color(cfg.pineColor)} },
          vertexShader:   `attribute float aSway;attribute float aPhase;uniform float uTime,uWind;void main(){vec3 p=position;float s=clamp(aSway,0.0,1.0);float w=sin(uTime*1.1+aPhase)*0.6+sin(uTime*2.4+aPhase*1.7)*0.4;p.x+=s*s*w*0.02*(0.35+uWind);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
          fragmentShader: `uniform vec3 uColor;void main(){gl_FragColor=vec4(uColor,1.0);}`,
        });
        const pmesh = new THREE.Mesh(geo, mat);
        pmesh.renderOrder = -32; dyn.add(pmesh);
        updaters.push(t => { mat.uniforms.uTime.value = t; mat.uniforms.uWind.value = windAt(t); });
      }
    }

    function addFlowers(cfg: FlowerCfg) {
      const N = cfg.count;
      const pos = new Float32Array(N*3), cc = new Float32Array(N*3), sz = new Float32Array(N), ph = new Float32Array(N);
      for (let i=0;i<N;i++) {
        const x = (Math.random()*2-1)*aspect*1.15;
        const y = cfg.yBot + Math.random()*(cfg.yTop-cfg.yBot);
        pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=0;
        const col = new THREE.Color(cfg.colors[i % cfg.colors.length]);
        cc[i*3]=col.r; cc[i*3+1]=col.g; cc[i*3+2]=col.b;
        sz[i] = cfg.size * (0.55+Math.random()*0.7) * (0.55+(y-cfg.yBot)/(cfg.yTop-cfg.yBot));
        ph[i] = Math.random()*TWO_PI;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('aCol',     new THREE.Float32BufferAttribute(cc, 3));
      geo.setAttribute('aSize',    new THREE.Float32BufferAttribute(sz, 1));
      geo.setAttribute('aPhase',   new THREE.Float32BufferAttribute(ph, 1));
      const mat = new THREE.ShaderMaterial({
        transparent:true, depthTest:false, depthWrite:false,
        uniforms: { uDpr:{value:dpr}, uTime:{value:0}, uWind:{value:0} },
        vertexShader:   `attribute vec3 aCol;attribute float aSize;attribute float aPhase;uniform float uDpr,uTime,uWind;varying vec3 vC;void main(){vC=aCol;vec3 p=position;p.x+=sin(uTime*1.4+aPhase)*(0.004+uWind*0.006);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);gl_PointSize=aSize*uDpr;}`,
        fragmentShader: `varying vec3 vC;void main(){float d=length(gl_PointCoord-0.5)*2.0;if(d>1.0)discard;gl_FragColor=vec4(vC,1.0-smoothstep(0.7,1.0,d));}`,
      });
      const pts = new THREE.Points(geo, mat);
      pts.renderOrder = -34; dyn.add(pts);
      updaters.push(t => { mat.uniforms.uTime.value = t; mat.uniforms.uWind.value = windAt(t); });
    }

    function addButterflies(n: number) {
      const palette = ['#F2A0C4','#F5D64E','#E86E9A','#FFFFFF','#F0B0D8'];
      const list: Array<{ mesh:THREE.Mesh; ox:number; oy:number; spd:number; phase:number; flap:number; wander:number }> = [];
      for (let i=0;i<n;i++) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0,-0.028,0.02,0,-0.028,-0.02,0, 0,0,0,0.028,0.02,0,0.028,-0.02,0], 3));
        geo.setIndex([0,1,2,3,4,5]);
        const mat = new THREE.MeshBasicMaterial({ color:new THREE.Color(palette[i%palette.length]), transparent:true, opacity:0.92, depthTest:false, depthWrite:false, side:THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        const ox = (Math.random()*2-1)*aspect;
        const oy = M.horizon - 0.05 + Math.random()*0.4;
        mesh.position.set(ox, oy, 0); mesh.renderOrder = -31; dyn.add(mesh);
        list.push({ mesh, ox, oy, spd:0.03+Math.random()*0.05, phase:Math.random()*TWO_PI, flap:7+Math.random()*4, wander:Math.random()*TWO_PI });
      }
      updaters.push((t, dt) => {
        const wind = windAt(t);
        list.forEach(b => {
          b.mesh.position.x += Math.cos(t*0.3+b.wander)*0.0015 - (b.spd+wind*0.02)*dt*0.4*(isStatic?0.4:1);
          b.mesh.position.y  = b.oy + Math.sin(t*0.7+b.phase)*0.06 + Math.sin(t*0.31+b.wander)*0.03;
          if (b.mesh.position.x < -aspect*1.2) b.mesh.position.x = aspect*1.2;
          const f = Math.abs(Math.sin(t*b.flap + b.phase));
          b.mesh.scale.set(0.28 + 0.72*f, 1, 1);
        });
      });
    }

    function addStars(intensity: number) {
      const N = Math.round(260*intensity);
      const pos = new Float32Array(N*3), ph = new Float32Array(N), sz = new Float32Array(N);
      for (let i=0;i<N;i++) {
        pos[i*3]   = (Math.random()*2-1)*aspect*1.1;
        pos[i*3+1] = M.horizon + Math.random()*(1-M.horizon) + 0.05;
        pos[i*3+2] = 0; ph[i] = Math.random()*TWO_PI; sz[i] = Math.random()*2 + 0.6;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('aPhase',   new THREE.Float32BufferAttribute(ph, 1));
      geo.setAttribute('aSize',    new THREE.Float32BufferAttribute(sz, 1));
      const mat = new THREE.ShaderMaterial({
        transparent:true, blending:THREE.AdditiveBlending, depthTest:false, depthWrite:false,
        uniforms: { uTime:{value:0}, uDpr:{value:dpr}, uInt:{value:intensity} },
        vertexShader:   `attribute float aPhase;attribute float aSize;uniform float uTime,uDpr;varying float vA;void main(){float tw=0.5+0.5*sin(uTime*0.8+aPhase);vA=0.3+0.7*tw;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*uDpr*(0.6+0.5*tw);}`,
        fragmentShader: `uniform float uInt;varying float vA;void main(){float d=length(gl_PointCoord-0.5)*2.0;if(d>1.0)discard;gl_FragColor=vec4(0.97,0.95,0.9,vA*uInt*(1.0-smoothstep(0.0,1.0,d)));}`,
      });
      const pts = new THREE.Points(geo, mat);
      pts.renderOrder = -65; dyn.add(pts);
      updaters.push(t => { mat.uniforms.uTime.value = t; });
    }

    function addGulls(n: number) {
      const list: Array<{ line:THREE.Line; ox:number; oy:number; spd:number; phase:number; flap:number; sx:number }> = [];
      for (let i=0;i<n;i++) {
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.04,0,0), new THREE.Vector3(0,0.018,0), new THREE.Vector3(0.04,0,0),
        ]);
        const mat = new THREE.LineBasicMaterial({ color:'#1a0d28', transparent:true, opacity:0.8, depthTest:false });
        const line = new THREE.Line(geo, mat);
        const ox = (Math.random()*2-1)*aspect, oy = 0.25 + Math.random()*0.4;
        const sx = 0.7 + Math.random()*0.8;
        line.position.set(ox, oy, 0); line.renderOrder = -55; line.scale.setScalar(sx); dyn.add(line);
        list.push({ line, ox, oy, spd:0.03+Math.random()*0.04, phase:Math.random()*TWO_PI, flap:1.5+Math.random()*1.5, sx });
      }
      updaters.push((t, dt) => {
        list.forEach(g => {
          g.line.position.x -= g.spd * (isStatic ? 0.3 : 1) * dt * 0.9;
          if (g.line.position.x < -aspect*1.2) g.line.position.x = aspect*1.2;
          g.line.position.y = g.oy + Math.sin(t*0.5 + g.phase)*0.03;
          const f = 0.5 + 0.5*Math.abs(Math.sin(t*g.flap + g.phase));
          g.line.scale.set(g.sx, g.sx*(0.4+0.6*f), 1);
        });
      });
    }

    function addShootingStar() {
      const mat = new THREE.SpriteMaterial({ map:glowTex, color:'#ffffff', transparent:true, opacity:0, depthTest:false, depthWrite:false, blending:THREE.AdditiveBlending });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(0.5, 0.05, 1); sp.renderOrder = -64; dyn.add(sp);
      let next = 4 + Math.random()*8, active = false, x0 = 0, y0 = 0, t0 = 0;
      updaters.push(t => {
        if (!active && t > next) { active=true; t0=t; x0=(Math.random()*0.6+0.1)*aspect; y0=0.5+Math.random()*0.4; }
        if (active) {
          const p = (t-t0)/0.7;
          sp.position.set(x0 - p*0.9*aspect, y0 - p*0.4, 0);
          mat.opacity = p<0.2 ? p/0.2 : (p>0.7 ? (1-p)/0.3 : 1);
          if (p >= 1) { active=false; mat.opacity=0; next=t+12+Math.random()*16; }
        }
      });
    }

    function addMotes() {
      const N = 34;
      const pos = new Float32Array(N*3), ph = new Float32Array(N);
      const data: Array<{ ox:number; oy:number; spd:number; amp:number; phase:number }> = [];
      for (let i=0;i<N;i++) {
        const x = (Math.random()*2-1)*aspect;
        const y = M.horizon - 0.05 + Math.random()*0.45;
        pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=0; ph[i]=Math.random()*TWO_PI;
        data.push({ ox:x, oy:y, spd:0.1+Math.random()*0.25, amp:0.03+Math.random()*0.05, phase:ph[i] });
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('aPhase',   new THREE.Float32BufferAttribute(ph, 1));
      const mat = new THREE.ShaderMaterial({
        transparent:true, blending:THREE.AdditiveBlending, depthTest:false, depthWrite:false,
        uniforms: { uTime:{value:0}, uDpr:{value:dpr} },
        vertexShader:   `attribute float aPhase;uniform float uTime,uDpr;varying float vA;void main(){float b=0.5+0.5*sin(uTime*0.9+aPhase);vA=b*0.4;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=(2.0+2.0*b)*uDpr;}`,
        fragmentShader: `varying float vA;void main(){float d=length(gl_PointCoord-0.5)*2.0;if(d>1.0)discard;gl_FragColor=vec4(1.0,0.95,0.7,vA*(1.0-d));}`,
      });
      const pts = new THREE.Points(geo, mat);
      pts.renderOrder = -44; dyn.add(pts);
      const pAttr = geo.attributes.position as THREE.BufferAttribute;
      updaters.push(t => {
        mat.uniforms.uTime.value = t;
        data.forEach((f, i) => pAttr.setXYZ(i, f.ox+Math.sin(t*f.spd+f.phase)*f.amp, f.oy+Math.cos(t*f.spd*0.7+f.phase)*f.amp*0.7, 0));
        pAttr.needsUpdate = true;
      });
    }
  }

  // ─── Moment switch ──────────────────────────────────────────────────────────

  let tween: { t:number; dur:number; from:THREE.Color[]; to:THREE.Color[]; key:SkyMomentKey; swapped:boolean } | null = null;

  function setMoment(key: SkyMomentKey, instant?: boolean) {
    const M = MOMENTS[key];
    const targetColors = M.sky.map((h: string) => new THREE.Color(h));
    if (instant || !curKey) {
      skyUniforms.uColors.value.forEach((c, i) => c.copy(targetColors[i]));
      build(key);
      return;
    }
    fadeMat.color.set(M.sky[M.sky.length - 2]);
    const fromColors = skyUniforms.uColors.value.map(c => c.clone());
    tween = { t:0, dur:0.7, from:fromColors, to:targetColors, key, swapped:false };
  }

  // ─── Loop ───────────────────────────────────────────────────────────────────

  const clock = new THREE.Clock();
  let animId: number, last = 0;

  function tick() {
    animId = requestAnimationFrame(tick);
    const t = clock.getElapsedTime(), dt = Math.min(t - last, 0.05); last = t;
    if (tween) {
      tween.t += dt;
      const raw = Math.min(tween.t / tween.dur, 1), p = emphasized(raw);
      fadeMat.opacity = raw < 0.5 ? (raw/0.5) : (1-(raw-0.5)/0.5);
      skyUniforms.uColors.value.forEach((c, i) => c.copy(tween!.from[i]).lerp(tween!.to[i], p));
      if (raw >= 0.5 && !tween.swapped) { try { build(tween.key); } catch(e) { console.error('sky-engine:', e); } tween.swapped = true; }
      if (raw >= 1) { fadeMat.opacity = 0; tween = null; }
    }
    for (let i=0;i<updaters.length;i++) try { updaters[i](t, dt); } catch(e) { /* ignore */ }
    renderer.render(scene, cam);
  }
  tick();

  // ─── Resize ─────────────────────────────────────────────────────────────────

  function onResize() {
    aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    cam.left = -aspect; cam.right = aspect; cam.updateProjectionMatrix();
    fadeMesh.scale.set(aspect, 1, 1);
    if (curKey) build(curKey);
  }
  window.addEventListener('resize', onResize);
  fadeMesh.scale.set(aspect, 1, 1);
  setMoment(opts?.moment ?? 'night', true);

  return {
    setMoment: (k) => setMoment(k),
    getMoment: () => curKey,
    destroy() {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      try { renderer.forceContextLoss(); } catch(e) { /* ignore */ }
      renderer.dispose();
    },
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const SkyEngine = {
  init(canvas: HTMLCanvasElement, opts?: SkyEngineOpts): SkyEngineCtrl {
    return create(canvas, opts);
  },
};
