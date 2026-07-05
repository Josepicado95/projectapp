# Mobile Scaffold + Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the initial Expo/React Native app at `apps/mobile` — project scaffold, NativeWind styling, and a complete login → session → logout cycle wired against the existing `/api/mobile/auth/*` endpoints — verifiable on a physical phone via Expo Go.

**Architecture:** Expo Router (file-based routing) + NativeWind (Tailwind for React Native), independent project (own `package.json`, not an npm workspace with `apps/web`). Tokens are stored in `expo-secure-store` (device keychain). A single fetch wrapper (`src/lib/api.ts`) attaches the access token to every request and transparently refreshes it on a `401 token_expired`, backed by `src/lib/secure-store.ts`. `src/lib/auth-context.tsx` exposes `{ user, isLoading, login, logout }` app-wide; the root layout (`src/app/_layout.tsx`) reads that context and redirects between `/login` and the `(tabs)` group.

**Tech Stack:** Expo SDK 57 (via `create-expo-app`), Expo Router, TypeScript, NativeWind v4 + Tailwind CSS, `expo-secure-store`.

**Spec:** `apps/mobile/docs/superpowers/specs/2026-07-05-mobile-scaffold-design.md`

## Global Constraints

- **Adaptation note (added after Task 1 ran):** the actual scaffold (Expo SDK 57's current default template) places routes under `apps/mobile/src/app/` — not `apps/mobile/app/` as assumed when this plan was first drafted — and ships a `@/*` → `./src/*` TypeScript path alias, already configured in `tsconfig.json`. Every task below uses `src/app/...` and `src/lib/...` paths, and imports across folders via the `@/` alias (e.g. `@/lib/auth-context`) instead of counting relative `../` levels. The scaffold's own example tab navigation (`NativeTabs` from `expo-router/unstable-native-tabs`, rendered via `src/components/app-tabs.tsx`) is deliberately **not** used — it's an explicitly unstable API — in favor of the stable `Tabs` component from `expo-router`, which Task 8 uses.
- Run all commands in this plan from `apps/mobile/` unless a step explicitly says otherwise (e.g. Task 1 Step 1, which creates that directory).
- All new source files use English identifiers; user-facing text (labels, error messages) is Spanish — same convention as `apps/web`.
- No automated test framework — verification is manual, via Expo Go on a physical phone (per spec's "Testing / Verification" section).
- Any client-side env var read by Expo at runtime **must** be prefixed `EXPO_PUBLIC_` (Expo's requirement for a variable to be embedded in the JS bundle) — e.g. `EXPO_PUBLIC_API_URL`, not `API_URL`.
- API error responses already follow `{ "error": { "code": "...", "message": "..." } }` (unchanged, existing contract from the mobile API) — `src/lib/api.ts` must parse exactly this shape.
- Dashboard, adventure detail, check-in, and progress screens are explicitly out of scope — do not add them here even as stubs beyond the two placeholder tabs this plan defines (Home, Profile).

---

### Task 1: Scaffold the Expo project — ✅ DONE (commit `9bbc7a1`)

Completed. Generated via `npx create-expo-app@latest mobile`, produced `apps/mobile/src/app/` (Expo Router, SDK 57 default template), `.env`/`.env.example` added, no nested git repo, `npx expo start` boots cleanly. See `.superpowers/sdd/task-1-report.md` for full detail. **Still needs a human to scan the QR with Expo Go** — folded into Task 9's verification pass instead of blocking here, since Task 9 already restarts the server for a full end-to-end phone check.

---

### Task 2: NativeWind styling

**Files:**
- Modify: `apps/mobile/babel.config.js` (create — scaffold doesn't generate one by default)
- Modify: `apps/mobile/metro.config.js` (create — scaffold doesn't generate one by default)
- Create: `apps/mobile/tailwind.config.js`
- Modify: `apps/mobile/src/global.css` (already exists — scaffold ships it with font CSS variables; **prepend** the Tailwind directives, don't overwrite)
- Create: `apps/mobile/nativewind-env.d.ts`
- Modify: `apps/mobile/src/app/_layout.tsx` (add the `@/global.css` import only — full rewrite happens in Task 6)

**Interfaces:**
- Produces: `className` prop support on React Native components project-wide, consumed by every screen written in Tasks 6–8.

- [ ] **Step 1: Install dependencies**

```bash
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context
```

- [ ] **Step 2: Generate and configure `tailwind.config.js`**

```bash
npx tailwindcss init
```

Replace its contents with:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 3: Add the Tailwind directives to the existing `src/global.css`**

Open `src/global.css` (it currently only has `:root { --font-display: ...; ... }` — font CSS variables from the scaffold). Add these three lines **above** the existing `:root { ... }` block, keeping the existing content below untouched:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Configure `babel.config.js`**

Create `babel.config.js` at `apps/mobile/` (project root, not under `src/`):

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

- [ ] **Step 5: Configure `metro.config.js`**

Create `metro.config.js` at `apps/mobile/` (project root), pointing at the existing CSS file's real path:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./src/global.css" });
```

- [ ] **Step 6: Add TypeScript types for `className`**

Create `nativewind-env.d.ts` at `apps/mobile/` (project root):

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 7: Import the stylesheet in the root layout**

In `src/app/_layout.tsx`, add as the first line (above existing imports):

```tsx
import "@/global.css";
```

- [ ] **Step 8: Verify styling actually applies**

Temporarily add a styled element to confirm the whole pipeline (babel + metro + tailwind) works before building real screens on top of it. In `src/app/index.tsx`, add this line inside the existing returned JSX (anywhere it renders):

```tsx
<Text className="text-red-500">NativeWind test</Text>
```

Run `npx expo start`, reload the app on your phone (shake the phone or press `r` in the terminal), and confirm the text "NativeWind test" renders in red. This confirms the setup before Task 8 replaces this screen's content entirely — no cleanup needed now, since Task 8 will overwrite this file.

- [ ] **Step 9: Commit**

```bash
git add babel.config.js metro.config.js tailwind.config.js src/global.css nativewind-env.d.ts src/app/_layout.tsx package.json package-lock.json src/app/index.tsx
git commit -m "feat(mobile): configure NativeWind styling"
```

---

### Task 3: Secure token storage wrapper

**Files:**
- Create: `apps/mobile/src/lib/secure-store.ts`

**Interfaces:**
- Produces: `getAccessToken(): Promise<string | null>`, `getRefreshToken(): Promise<string | null>`, `setTokens(accessToken: string, refreshToken: string): Promise<void>`, `clearTokens(): Promise<void>`.
- Consumed by: Task 4 (`@/lib/api`) and Task 5 (`@/lib/auth-context`).

- [ ] **Step 1: Install `expo-secure-store`**

```bash
npx expo install expo-secure-store
```

- [ ] **Step 2: Write the wrapper**

Create `src/lib/secure-store.ts`:

```ts
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "aventuras_access_token";
const REFRESH_TOKEN_KEY = "aventuras_refresh_token";

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/lib/secure-store.ts
git commit -m "feat(mobile): add secure token storage wrapper"
```

---

### Task 4: API client with automatic token refresh

**Files:**
- Create: `apps/mobile/src/lib/api.ts`

**Interfaces:**
- Consumes: `getAccessToken`, `getRefreshToken`, `setTokens`, `clearTokens` from `@/lib/secure-store` (Task 3).
- Produces: `apiRequest<T>(path: string, options?: RequestInit): Promise<T>`, `ApiError` class with `status: number`, `code: string`, `message: string`.
- Consumed by: Task 5 (`@/lib/auth-context`) and Task 8 (Home screen's `GET /auth/me` call).

- [ ] **Step 1: Write the API client**

Create `src/lib/api.ts`:

```ts
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type ErrorBody = { error?: { code?: string; message?: string } };

async function rawRequest(path: string, options: RequestInit, accessToken?: string): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await rawRequest("/api/mobile/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await clearTokens();
    return null;
  }

  const data = await res.json();
  await setTokens(data.accessToken, data.refreshToken);
  return data.accessToken as string;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = await getAccessToken();
  let res = await rawRequest(path, options, accessToken ?? undefined);
  let body: (ErrorBody & Record<string, unknown>) | null = await res.json().catch(() => null);

  if (res.status === 401 && body?.error?.code === "token_expired") {
    const refreshedToken = await tryRefresh();
    if (refreshedToken) {
      res = await rawRequest(path, options, refreshedToken);
      body = await res.json().catch(() => null);
    }
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error?.code ?? "unknown_error",
      body?.error?.message ?? "Ocurrió un error inesperado."
    );
  }

  return body as T;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat(mobile): add API client with refresh-on-401"
```

---

### Task 5: Auth context

**Files:**
- Create: `apps/mobile/src/lib/auth-context.tsx`

**Interfaces:**
- Consumes: `apiRequest`, `ApiError` from `@/lib/api` (Task 4); `getRefreshToken`, `setTokens`, `clearTokens` from `@/lib/secure-store` (Task 3).
- Produces: `AuthProvider` (component), `useAuth(): { user: { id: number; name: string; email: string } | null; isLoading: boolean; login(email: string, password: string): Promise<void>; logout(): Promise<void> }`.
- Consumed by: Task 6 (`src/app/_layout.tsx`), Task 7 (`src/app/login.tsx`), Task 8 (Home/Profile screens).

- [ ] **Step 1: Write the auth context**

Create `src/lib/auth-context.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getRefreshToken, setTokens, clearTokens } from "./secure-store";
import { apiRequest } from "./api";

type User = { id: number; name: string; email: string };

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await apiRequest<User>("/api/mobile/auth/me");
      setUser(me);
    } catch {
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await apiRequest<{ accessToken: string; refreshToken: string; user: User }>(
      "/api/mobile/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    );
    await setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  }

  async function logout() {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await apiRequest("/api/mobile/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    await clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth-context.tsx
git commit -m "feat(mobile): add auth context (session restore, login, logout)"
```

---

### Task 6: Root layout with auth-gated redirect

**Files:**
- Modify: `apps/mobile/src/app/_layout.tsx`

**Interfaces:**
- Consumes: `AuthProvider`, `useAuth` from `@/lib/auth-context` (Task 5).

- [ ] **Step 1: Replace the root layout**

Replace the full contents of `src/app/_layout.tsx` with (this fully replaces the scaffold's default splash-screen/NativeTabs wiring — that's intentional, see the Global Constraints adaptation note):

```tsx
import "@/global.css";
import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function RootNavigation() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inTabsGroup = segments[0] === "(tabs)";
    if (!user && inTabsGroup) {
      router.replace("/login");
    } else if (user && !inTabsGroup) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments]);

  if (isLoading) return null;
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/_layout.tsx
git commit -m "feat(mobile): auth-gated redirect between login and tabs"
```

---

### Task 7: Login screen

**Files:**
- Create: `apps/mobile/src/app/login.tsx`

**Interfaces:**
- Consumes: `useAuth` from `@/lib/auth-context` (Task 5), `ApiError` from `@/lib/api` (Task 4).

- [ ] **Step 1: Write the login screen**

Create `src/app/login.tsx`:

```tsx
import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo conectar. Revisa que tu celular y tu PC estén en la misma red Wi-Fi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="flex-1 justify-center bg-[#1E282A] px-6">
      <Text className="text-2xl font-bold text-[#ECE6D8] mb-6">Aventuras</Text>
      <TextInput
        className="bg-[#2A363A] text-[#ECE6D8] rounded-xl px-4 py-3 mb-3"
        placeholder="Correo"
        placeholderTextColor="#8A9490"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="bg-[#2A363A] text-[#ECE6D8] rounded-xl px-4 py-3 mb-3"
        placeholder="Contraseña"
        placeholderTextColor="#8A9490"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text className="text-[#F0A0A0] mb-3">{error}</Text>}
      <Pressable
        className="bg-[#7E9A86] rounded-xl py-3 items-center"
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text className="text-[#1E282A] font-bold">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/login.tsx
git commit -m "feat(mobile): add login screen"
```

---

### Task 8: Authenticated tab shell (Home + Profile)

**Files:**
- Create: `apps/mobile/src/app/(tabs)/_layout.tsx`
- Modify: `apps/mobile/src/app/(tabs)/index.tsx` (move `src/app/index.tsx` into this new group folder and replace its contents)
- Create: `apps/mobile/src/app/(tabs)/profile.tsx`
- Delete: `apps/mobile/src/app/explore.tsx`, `apps/mobile/src/components/app-tabs.tsx` — the scaffold's own example screen and its `NativeTabs` component, both out of scope and superseded by this task's stable-`Tabs` implementation

**Interfaces:**
- Consumes: `useAuth` from `@/lib/auth-context` (Task 5).

- [ ] **Step 1: Remove the scaffold's example tab screen and component**

```bash
rm src/app/explore.tsx
rm src/components/app-tabs.tsx
```

(`src/app/index.tsx` is not deleted — Step 3 below moves it into the new `(tabs)` group.)

- [ ] **Step 2: Create the tab group layout**

Create `src/app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: Move and replace the Home screen**

Move `src/app/index.tsx` to `src/app/(tabs)/index.tsx` (delete the old one, create the new one — Expo Router treats this as a different route, from `/` to `/(tabs)` → `/`, which is what we want now that the tab group owns it), with these full contents:

```tsx
import { View, Text } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function HomeScreen() {
  const { user } = useAuth();
  return (
    <View className="flex-1 items-center justify-center bg-[#1E282A]">
      <Text className="text-xl text-[#ECE6D8]">Hola, {user?.name}</Text>
    </View>
  );
}
```

- [ ] **Step 4: Create the Profile screen**

Create `src/app/(tabs)/profile.tsx`:

```tsx
import { View, Text, Pressable } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  return (
    <View className="flex-1 items-center justify-center bg-[#1E282A] px-6">
      <Text className="text-lg text-[#ECE6D8] mb-6">{user?.email}</Text>
      <Pressable className="bg-[#C48FB4] rounded-xl px-6 py-3" onPress={logout}>
        <Text className="text-[#1E282A] font-bold">Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add -A src/app src/components
git commit -m "feat(mobile): add Home and Profile tab screens"
```

---

### Task 9: Full end-to-end verification on a physical phone

**Files:** none (verification only).

- [ ] **Step 1: Find your PC's LAN IP**

Run (Windows): `ipconfig`
Look for the "Wireless LAN adapter Wi-Fi" section's `IPv4 Address` (e.g. `192.168.1.23`). Your phone and PC must be on the same Wi-Fi network.

- [ ] **Step 2: Point the mobile app at your PC**

Edit `apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://<TU-IP-LOCAL>:3000
```

(Replace `<TU-IP-LOCAL>` with the address from Step 1.)

- [ ] **Step 3: Start both servers**

Terminal 1, from `apps/web`:
```bash
npm run dev
```

Terminal 2, from `apps/mobile`:
```bash
npx expo start
```

If Expo Go isn't installed yet, install it now (Play Store / App Store). Scan the QR code with Expo Go.

- [ ] **Step 4: Walk through the verification checklist**

1. App opens with no stored session → lands on the login screen.
2. Enter a wrong password (correct email, e.g. `jose@aventuras.com`, wrong password) → an error message appears under the form.
3. Enter the correct credentials (`jose@aventuras.com` / `aventuras123`) → navigates to the tabs; the Home screen shows "Hola, Jose" (confirms `GET /auth/me` round-tripped with the token issued at login).
4. Force-quit the Expo Go app completely and reopen it → still on the Home screen without having to log in again (confirms the token persisted in secure storage and `restoreSession` worked).
5. Go to the Profile tab, tap "Cerrar sesión" → returns to the login screen. Force-quit and reopen the app again → still shows the login screen (confirms logout actually cleared the stored session, not just the in-memory state).

- [ ] **Step 5: Report results**

If every step in the checklist matches, the sub-project is complete. If a Windows Firewall prompt appears the first time the phone connects, allow the connection (Node.js on the requested network type) and retry Step 3.

---

## Self-Review Notes

- **Spec coverage:** every architecture item from `2026-07-05-mobile-scaffold-design.md` maps to a task — scaffold (Task 1, done), NativeWind (Task 2), token storage (Task 3), API client + refresh (Task 4), auth context (Task 5), root layout redirect (Task 6), login screen (Task 7), tab shell (Task 8), verification (Task 9). The three risks in the spec's "Risks & Mitigations" table are addressed: Expo Go install (Task 9 Step 3), LAN IP instead of `localhost` (Task 9 Steps 1–2), Windows Firewall (Task 9 Step 5).
- **Scope check:** dashboard, adventure detail, check-in, and progress screens are explicitly not touched anywhere in this plan, matching the spec's Non-Goals.
- **Type consistency:** `User` type (`{ id: number; name: string; email: string }`) is defined once in Task 5 and reused by name in Tasks 6–8 without being redefined differently. `apiRequest<T>` and `ApiError` (Task 4) are consumed with matching signatures in Task 5 (auth calls) and Task 7 (login screen's `catch` block).
- **Post-Task-1 correction (this revision):** all `app/` paths corrected to `src/app/`, all `lib/` paths corrected to `src/lib/`, all cross-folder imports switched from relative `../` counting to the `@/` alias, `global.css` changed from "create" to "modify existing" (scaffold already ships one, with unrelated font-variable content that must be preserved), and Task 8 now explicitly deletes the scaffold's `NativeTabs`-based example (`app-tabs.tsx`, `explore.tsx`) instead of assuming a `(tabs)` folder already existed to prune.
