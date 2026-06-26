# Three.js Cinematic Backgrounds — Design Spec
**Date:** 2026-06-25
**Status:** Approved

---

## Overview

Replace the current CSS parallax background system with four fully 3D scenes rendered via React Three Fiber (R3F). Each scene corresponds to a time-of-day moment (mañana / tarde / atardecer / noche) and includes a weather layer designed to accept real weather data in the future.

---

## Goals

- Visually stunning 3D backgrounds that feel alive (particles, moving geometry, atmosphere)
- Respect the user's local hour (same `getMoment(localHour)` logic already in place)
- Architecture ready to accept `weather` prop from a real weather API without refactoring
- Works on all devices (full Three.js everywhere; performance tuning deferred to a future pass)

---

## Non-Goals

- Per-device performance degradation (no CSS fallback for mobile — deferred)
- Real weather API integration (scaffolded but not activated in this spec)
- Sound design

---

## Dependencies

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

Estimated bundle addition: ~350 KB gzip (three.js tree-shaken + fiber + selective drei imports).

---

## Architecture

### File structure

```
apps/web/
  components/
    background/
      ThreeBackground.tsx       # dynamic() wrapper — SSR: false
      ThreeCanvas.tsx           # <Canvas> + scene selector + weather layer
      scenes/
        MorningScene.tsx        # 06–11 h — lake at dawn
        AfternoonScene.tsx      # 11–17 h — open meadow
        SunsetScene.tsx         # 17–20 h — rocky coast
        NightScene.tsx          # 20–06 h — valley + aurora
      weather/
        RainLayer.tsx           # inclined rain particles + dark clouds
        SnowLayer.tsx           # slow white snowflake particles
  lib/
    weather.ts                  # getWeather() stub → undefined today
```

### Component API

```tsx
// Entry point (dynamic, no SSR)
<ThreeBackground moment="noche" weather={undefined} />

// Props
type Props = {
  moment:  "manana" | "tarde" | "atardecer" | "noche";
  weather?: "rain" | "snow" | "fog" | "storm" | "clear";
}
```

`ThreeBackground` wraps `ThreeCanvas` in a `dynamic()` import with `ssr: false`. This ensures Three.js never runs server-side.

`ThreeCanvas` renders a full-screen R3F `<Canvas>` (`position: absolute`, `inset: 0`, `z-index: 0`) and mounts the correct scene + optional weather layer based on props.

Page content (nav rail, cards, forms) lives in a `position: relative; z-index: 1` container that floats above the canvas.

---

## Scenes

### Morning — Mañana (06–11 h)
**Environment:** Mountain lake at sunrise  
**Elements:**
- `<Sky>` (Drei) with warm orange/pink/blue gradient, sun just above horizon
- Calm lake plane with reflective `<MeshReflectorMaterial>` (Drei)
- Volumetric ground fog (`<fog>`) rising from the water surface
- Pine tree silhouettes in foreground with gentle `av-sway` equivalent via `useFrame`
- Snow-capped distant mountains (low-poly geometry)
- Slow golden particle dust floating upward
- Camera: fixed low angle, subtle breathing motion (up/down ±0.3 units over 8 s)

### Afternoon — Tarde (11–17 h)
**Environment:** Open green meadow  
**Elements:**
- `<Sky>` with bright blue, high sun
- Rolling hill geometry with grass displacement shader
- `<Cloud>` components (Drei) drifting slowly left-to-right
- Large tree mesh (billboard or low-poly) swaying
- Butterfly particles (small white quads, randomized flutter path)
- Ambient occlusion post-processing for depth
- Camera: slightly elevated, slow pan left/right ±5° over 30 s

### Sunset — Atardecer (17–20 h)
**Environment:** Rocky coastal cliff  
**Elements:**
- `<Sky>` with dramatic orange/magenta/purple gradient
- `<Water>` (Drei) for ocean surface with sun reflection line
- Dark rock silhouettes in foreground
- Seagull particles (small triangle quads) in silhouette drifting on wind
- Heat shimmer post-processing on horizon
- Camera: medium height, very slow dolly forward ±2 units over 20 s

### Night — Noche (20–06 h)
**Environment:** Mountain valley with aurora  
**Elements:**
- `<Stars>` (Drei) — 5 000+ particles, randomized size, gentle rotation
- Aurora borealis: fullscreen shader plane with GLSL wave animation in greens/blues/purples
- Mountain silhouettes (dark geometry)
- Moon sphere with `<pointLight>` casting soft shadows
- Firefly particles near ground level (pulsing opacity, slow random walk)
- Camera: fixed wide angle, very slow drift left ±3 units over 40 s

---

## Weather Layer

Weather is an additive layer rendered on top of the active scene. It is always optional (`weather` prop defaults to `undefined` = clear).

| Value   | Effect |
|---------|--------|
| `clear` | No overlay (same as undefined) |
| `rain`  | `RainLayer`: 2 000 streak particles, 15° tilt, semi-transparent; dark cloud plane at top |
| `snow`  | `SnowLayer`: 1 500 white sphere particles, slow fall, gentle horizontal drift |
| `fog`   | R3F `<fog>` + `<fogExp2>` to reduce scene visibility to ~20 units |
| `storm` | `RainLayer` at 2× intensity + occasional `<pointLight>` flash for lightning |

---

## Future Weather API Hook

`lib/weather.ts` exports:

```ts
// Today: always returns undefined (clear)
export async function getWeather(lat: number, lon: number): Promise<WeatherCondition | undefined> {
  return undefined;
}
```

When activated, this will call Open-Meteo (free, no API key) and map WMO weather codes to `WeatherCondition`. Page server components already pass the result to `<ThreeBackground weather={await getWeather(lat, lon)} />` — no refactor needed.

---

## Integration Plan

Pages to update (remove CSS parallax divs, add `<ThreeBackground>`):

1. `app/page.tsx` — dashboard
2. `app/checkin/page.tsx` / `components/CheckInBody.tsx`
3. `app/progress/page.tsx`
4. `app/login/page.tsx` / `app/register/page.tsx`

The `getMoment(localHour)` call remains in each server component. Its `key` field (`"manana"` etc.) is passed directly as the `moment` prop.

---

## Implementation Order

1. Install dependencies
2. Build `NightScene` + `ThreeBackground` wrapper → integrate in dashboard only → verify cards float correctly above canvas
3. Build `MorningScene`, `AfternoonScene`, `SunsetScene`
4. Integrate all scenes in dashboard via `moment` prop
5. Integrate in `checkin`, `progress`, `login`, `register` pages
6. Build `RainLayer` + `SnowLayer`
7. Clean up unused CSS `@keyframes av-*` from `globals.css`

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `backdrop-filter` on cards conflicts with WebGL canvas | Set `isolation: isolate` on card container; test on Chrome/Safari |
| Bundle size too large for slow connections | Lazy-load each scene component inside `ThreeCanvas` with `React.lazy` |
| `@react-three/drei` `<Water>` needs specific Three.js version | Pin versions; check drei peer deps before install |
| Memory leaks from Three.js geometries not disposed | Use R3F's automatic disposal; add explicit `dispose` in `useEffect` cleanup for custom geometries |
