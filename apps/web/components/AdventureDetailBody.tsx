"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ThreeBackground from "@/components/background/ThreeBackground";
import NewMissionForm from "@/components/NewMissionForm";
import MissionList from "@/components/MissionList";
import type { MomentKey } from "@/lib/theme";
import type { Mission } from "@/lib/generated/prisma/client";

type AdventureDetail = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  paletteIdx: number;
  createdAt: string;
  missions: Mission[];
};

type Props = { adventureId: number; momentKey: MomentKey };
type LoadState = "loading" | "ready" | "not-found" | "error";

export default function AdventureDetailBody({ adventureId, momentKey }: Props) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [adventure, setAdventure] = useState<AdventureDetail | null>(null);

  // Used by children after a mutation (create/edit/delete mission) to pull fresh data.
  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/mobile/adventures/${adventureId}`);
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.status === 404) {
        setLoadState("not-found");
        return;
      }
      if (!res.ok) throw new Error("load_failed");
      setAdventure(await res.json());
      setLoadState("ready");
    } catch {
      setLoadState((prev) => (prev === "loading" ? "error" : prev));
    }
  }, [adventureId]);

  // Deliberately NOT calling `load()` here: this closure lives entirely inside the
  // effect (never handed out as a stable reference elsewhere), with its own
  // cancellation guard tied to this specific adventureId — so a stale response for
  // a previous adventureId can't overwrite the one the user is now viewing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/mobile/adventures/${adventureId}`);
        if (cancelled) return;
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (res.status === 404) {
          setLoadState("not-found");
          return;
        }
        if (!res.ok) throw new Error("load_failed");
        const data = await res.json();
        if (cancelled) return;
        setAdventure(data);
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState((prev) => (prev === "loading" ? "error" : prev));
      }
    })();
    return () => { cancelled = true; };
  }, [adventureId]);

  if (loadState === "loading") {
    return (
      <div style={{ position: "relative", height: "100vh", overflow: "hidden", fontFamily: "var(--font-hanken), sans-serif", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A8FA0" }}>
        <ThreeBackground moment={momentKey} />
        <div style={{ position: "relative", zIndex: 1 }}>Cargando aventura…</div>
      </div>
    );
  }

  if (loadState === "not-found" || loadState === "error") {
    return (
      <div style={{ position: "relative", height: "100vh", overflow: "hidden", fontFamily: "var(--font-hanken), sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "#7A8FA0" }}>
        <ThreeBackground moment={momentKey} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {loadState === "not-found" ? "Aventura no encontrada." : "No se pudo cargar la aventura."}
        </div>
        <Link href="/" style={{ position: "relative", zIndex: 1, color: "#7EB8D8", textDecoration: "none" }}>
          ← Volver al dashboard
        </Link>
      </div>
    );
  }

  const adv = adventure!;
  const completedCount = adv.missions.filter((m) => m.completed).length;
  const pct = adv.missions.length === 0 ? 0 : Math.round((completedCount / adv.missions.length) * 100);

  return (
    <div style={{ position: "relative", height: "100vh", overflow: "hidden", fontFamily: "var(--font-hanken), sans-serif" }}>
      <ThreeBackground moment={momentKey} />

      <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 1 }}>

        {/* Nav rail */}
        <nav className="av-nav-rail" style={{
          flexShrink: 0, width: 84,
          background: "rgba(10,15,26,.66)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(236,230,216,.1)",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "22px 0",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "radial-gradient(circle at 60% 35%, #F0EAD8, #9DB6A4)",
            boxShadow: "0 0 18px rgba(240,234,216,.3)",
            marginBottom: 24, flexShrink: 0,
          }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            {[
              { icon: "⛰", label: "Aventuras", href: "/",         active: true  },
              { icon: "♡", label: "Check-in",  href: "/checkin",  active: false },
              { icon: "◷", label: "Progreso",  href: "/progress", active: false },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 15,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 4,
                  ...(item.active
                    ? { background: "rgba(91,155,209,.2)", border: "1px solid rgba(146,199,230,.45)", color: "#CDE6F5" }
                    : { color: "#9FB4C6" }),
                }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 600 }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* Scrollable content */}
        <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "28px 28px 64px" }}>

          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "#7A8FA0", textDecoration: "none", marginBottom: 22,
          }}>
            ← Volver al dashboard
          </Link>

          {/* Adventure header */}
          <div style={{
            background: "rgba(14,20,36,.82)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(236,230,216,.14)",
            borderRadius: 24,
            padding: "28px 28px 22px",
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
              <h1 style={{
                fontFamily: "var(--font-schibsted)",
                fontWeight: 700, fontSize: 22, color: "#F2EFE6", lineHeight: 1.25, margin: 0,
              }}>
                {adv.title}
              </h1>
              <span style={{
                flexShrink: 0,
                background: "rgba(126,154,134,.12)",
                border: "1px solid rgba(126,154,134,.3)",
                borderRadius: 12,
                padding: "5px 13px",
                fontSize: 13, fontWeight: 700, color: "#7E9A86",
              }}>
                {pct}%
              </span>
            </div>

            {adv.description && (
              <p style={{ fontSize: 14, color: "#7A8FA0", lineHeight: 1.55, marginBottom: 16 }}>
                {adv.description}
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 5, borderRadius: 5, background: "rgba(236,230,216,.1)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 5,
                  background: "linear-gradient(90deg,#7E9A8699,#7E9A86)",
                  width: `${pct}%`,
                  transition: "width .5s cubic-bezier(.2,0,0,1)",
                }} />
              </div>
              <span style={{ flexShrink: 0, fontSize: 12, color: "#5A6A78" }}>
                {completedCount} / {adv.missions.length} misiones
              </span>
            </div>
          </div>

          {/* Missions */}
          <div style={{
            background: "rgba(14,20,36,.78)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(236,230,216,.12)",
            borderRadius: 20,
            padding: "22px 24px",
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: ".09em",
              textTransform: "uppercase", color: "#4E6070", marginBottom: 18,
            }}>
              Misiones
            </p>
            <NewMissionForm adventureId={adv.id} onCreated={load} />
            <MissionList missions={adv.missions} onChanged={load} />
          </div>

        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="av-bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(10,15,26,.88)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(236,230,216,.1)",
        padding: "10px 0 16px",
        justifyContent: "space-around", alignItems: "center",
        zIndex: 60,
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#CDE6F5" }}>
          <span style={{ fontSize: 22 }}>⛰</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Aventuras</span>
        </Link>
        <Link href="/checkin" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#9FB4C6" }}>
          <span style={{ fontSize: 22 }}>♡</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Check-in</span>
        </Link>
        <Link href="/progress" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#9FB4C6" }}>
          <span style={{ fontSize: 22 }}>◷</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Progreso</span>
        </Link>
      </div>
    </div>
  );
}
