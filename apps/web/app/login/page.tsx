"use client";

import { useActionState, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import ThreeBackground from "@/components/background/ThreeBackground";

type LoginState = { error?: string; success?: boolean };
const initialState: LoginState = {};

function JustRegisteredMessage() {
  const searchParams = useSearchParams();
  if (searchParams.get("registered") !== "true") return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "rgba(126,154,134,.12)", border: "1px solid rgba(126,154,134,.3)",
      borderRadius: 11, padding: "10px 13px", marginBottom: 18,
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: 13, color: "#A8C8A8" }}>¡Cuenta creada! Ya puedes iniciar sesión.</span>
    </div>
  );
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [transitioning, setTransitioning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!state.success) return;
    setTransitioning(true);
    const t = setTimeout(() => router.push("/"), 700);
    return () => clearTimeout(t);
  }, [state.success, router]);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100vh", overflow: "hidden",
      background: "linear-gradient(180deg,#0C1428 0%,#172040 35%,#243358 68%,#2E4168 100%)",
      fontFamily: "var(--font-hanken), sans-serif",
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes av-dawn   { 0%{opacity:1} 55%{opacity:.65} 100%{opacity:0} }
        @keyframes lg-rise   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lg-dawn-in{ from{opacity:0} to{opacity:1} }
        .av-input { color-scheme: dark; }
        .av-input:focus { outline: none; border-color: rgba(146,199,230,.6) !important; box-shadow: 0 0 0 3px rgba(91,155,209,.14); }
        .av-input::placeholder { color: rgba(236,230,216,.3); }
      `}} />

      <ThreeBackground moment="noche" isStatic />

      {/* Opening dawn curtain — fades out revealing the background */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 8, pointerEvents: "none",
        background: "linear-gradient(180deg,#0E1630 0%,#1B2647 42%,#27375E 74%,#34496F 100%)",
        animation: "av-dawn 3.8s cubic-bezier(.4,0,.15,1) .15s forwards",
      }} />

      {/* Form overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 9,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>

        {/* Logo + wordmark */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 24,
          animation: "lg-rise .5s ease both",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "radial-gradient(circle at 60% 35%, #F0EAD8, #9DB6A4)",
            boxShadow: "0 0 24px rgba(240,234,216,.35), 0 4px 16px rgba(0,0,0,.3)",
          }} />
          <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 700, fontSize: 18, color: "#F2EFE6", letterSpacing: ".02em", textShadow: "0 1px 6px rgba(0,0,0,.4)" }}>
            Aventuras
          </div>
        </div>

        {/* Glass card */}
        <div style={{
          width: "100%", maxWidth: 420,
          background: "rgba(12,18,30,.84)",
          backdropFilter: "blur(28px) saturate(1.3)",
          WebkitBackdropFilter: "blur(28px) saturate(1.3)",
          border: "1px solid rgba(236,230,216,.16)",
          borderRadius: 28,
          boxShadow: "0 32px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(236,230,216,.12)",
          padding: "36px 34px 32px",
          animation: "lg-rise .55s ease .08s both",
        }}>
          <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 700, fontSize: 26, color: "#F2EFE6", lineHeight: 1.15, marginBottom: 6 }}>
            Bienvenido de vuelta
          </div>
          <div style={{ fontSize: 14, color: "#7A8FA0", marginBottom: 28, lineHeight: 1.4 }}>
            Continúa donde lo dejaste.
          </div>

          <Suspense>
            <JustRegisteredMessage />
          </Suspense>

          <form action={formAction}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="email" style={{ display: "block", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, color: "#7FA8C4", marginBottom: 7 }}>
                Email
              </label>
              <input
                id="email" name="email" type="email" required
                placeholder="tu@email.com"
                className="av-input"
                style={{ width: "100%", fontFamily: "var(--font-hanken)", fontSize: 15, color: "#ECE6D8", background: "rgba(236,230,216,.07)", border: "1px solid rgba(236,230,216,.18)", borderRadius: 13, padding: "13px 15px", boxSizing: "border-box" }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label htmlFor="password" style={{ display: "block", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, color: "#7FA8C4", marginBottom: 7 }}>
                Contraseña
              </label>
              <input
                id="password" name="password" type="password" required
                placeholder="••••••••"
                className="av-input"
                style={{ width: "100%", fontFamily: "var(--font-hanken)", fontSize: 15, color: "#ECE6D8", background: "rgba(236,230,216,.07)", border: "1px solid rgba(236,230,216,.18)", borderRadius: 13, padding: "13px 15px", boxSizing: "border-box" }}
              />
            </div>

            {/* Error */}
            {state.error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(220,80,80,.12)", border: "1px solid rgba(220,80,80,.28)", borderRadius: 11, padding: "10px 13px", marginBottom: 18 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
                <span style={{ fontSize: 13, color: "#F0A0A0" }}>{state.error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={pending}
              style={{
                width: "100%", fontFamily: "var(--font-hanken)", fontWeight: 700, fontSize: 15,
                color: "#1E282A",
                background: pending ? "rgba(227,168,120,.5)" : "linear-gradient(135deg,#E3A878 0%,#C8885A 100%)",
                border: "none", borderRadius: 14, padding: 15,
                cursor: pending ? "wait" : "pointer",
                marginBottom: 20, boxShadow: "0 8px 24px rgba(227,168,120,.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "transform .18s ease, box-shadow .18s ease",
              }}
            >
              <span>{pending ? "Entrando..." : "Entrar"}</span>
              {!pending && <span style={{ fontSize: 17 }}>→</span>}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(236,230,216,.1)" }} />
            <span style={{ fontSize: 12, color: "rgba(236,230,216,.28)" }}>o</span>
            <div style={{ flex: 1, height: 1, background: "rgba(236,230,216,.1)" }} />
          </div>

          {/* Toggle */}
          <div style={{ textAlign: "center", fontSize: 14, color: "#7A8FA0" }}>
            ¿No tienes cuenta?{" "}
            <Link href="/register" style={{ color: "#7EB8D8", fontWeight: 600, textDecoration: "none" }}>
              Créala aquí
            </Link>
          </div>
        </div>

        {/* Legal */}
        <div style={{
          marginTop: 18, fontSize: 11.5, color: "rgba(236,230,216,.28)", textAlign: "center",
          animation: "lg-rise .55s ease .16s both",
        }}>
          Al continuar aceptas los términos de uso y la política de privacidad.
        </div>
      </div>

      {/* Closing curtain — aparece al hacer login exitoso */}
      {transitioning && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99, pointerEvents: "none",
          background: "linear-gradient(180deg,#0C1428 0%,#172040 35%,#243358 68%,#2E4168 100%)",
          animation: "lg-dawn-in 600ms cubic-bezier(.4,0,.15,1) forwards",
        }} />
      )}
    </div>
  );
}
