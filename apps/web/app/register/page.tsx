"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import ThreeBackground from "@/components/background/ThreeBackground";

type RegisterState = {
  errors?: { name?: string[]; email?: string[]; password?: string[] };
  general?: string;
};
const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <div style={{ position: "relative", height: "100vh", overflow: "hidden", background: "linear-gradient(180deg,#0C1428 0%,#172040 35%,#243358 68%,#2E4168 100%)" }}>
      <ThreeBackground moment="noche" isStatic />

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        {/* Logo + wordmark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "radial-gradient(circle at 60% 35%, #F0EAD8, #9DB6A4)",
            boxShadow: "0 0 24px rgba(240,234,216,.35), 0 4px 16px rgba(0,0,0,.3)",
          }} />
          <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 700, fontSize: 18, color: "#F2EFE6", letterSpacing: ".02em", textShadow: "0 1px 6px rgba(0,0,0,.4)" }}>
            Aventuras
          </div>
        </div>

        {/* Card */}
        <div style={{
          width: "100%", maxWidth: 420,
          background: "rgba(12,18,30,.84)",
          backdropFilter: "blur(28px) saturate(1.3)",
          WebkitBackdropFilter: "blur(28px) saturate(1.3)",
          border: "1px solid rgba(236,230,216,.16)",
          borderRadius: 28,
          boxShadow: "0 32px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(236,230,216,.12)",
          padding: "36px 34px 32px",
        }}>
          <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 700, fontSize: 26, color: "#F2EFE6", lineHeight: 1.15, marginBottom: 6 }}>
            Empieza tu aventura
          </div>
          <div style={{ fontSize: 14, color: "#7A8FA0", marginBottom: 28 }}>
            Crea tu cuenta y comienza el camino.
          </div>

          <form action={formAction}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, color: "#7FA8C4", marginBottom: 7 }}>Nombre</div>
              <input
                name="name"
                type="text"
                required
                placeholder="Tu nombre"
                style={{
                  width: "100%", fontFamily: "var(--font-hanken)", fontSize: 15,
                  color: "#ECE6D8", background: "rgba(236,230,216,.07)",
                  border: `1px solid ${state.errors?.name ? "rgba(216,100,100,.5)" : "rgba(236,230,216,.18)"}`, borderRadius: 13,
                  padding: "13px 15px", outline: "none", boxSizing: "border-box",
                }}
              />
              {state.errors?.name && (
                <div style={{ fontSize: 12.5, color: "#E8A0A0", marginTop: 5 }}>{state.errors.name[0]}</div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, color: "#7FA8C4", marginBottom: 7 }}>Email</div>
              <input
                name="email"
                type="email"
                required
                placeholder="tu@email.com"
                style={{
                  width: "100%", fontFamily: "var(--font-hanken)", fontSize: 15,
                  color: "#ECE6D8", background: "rgba(236,230,216,.07)",
                  border: `1px solid ${state.errors?.email ? "rgba(216,100,100,.5)" : "rgba(236,230,216,.18)"}`, borderRadius: 13,
                  padding: "13px 15px", outline: "none", boxSizing: "border-box",
                }}
              />
              {state.errors?.email && (
                <div style={{ fontSize: 12.5, color: "#E8A0A0", marginTop: 5 }}>{state.errors.email[0]}</div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, color: "#7FA8C4", marginBottom: 7 }}>Contraseña</div>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                style={{
                  width: "100%", fontFamily: "var(--font-hanken)", fontSize: 15,
                  color: "#ECE6D8", background: "rgba(236,230,216,.07)",
                  border: `1px solid ${state.errors?.password ? "rgba(216,100,100,.5)" : "rgba(236,230,216,.18)"}`, borderRadius: 13,
                  padding: "13px 15px", outline: "none", boxSizing: "border-box",
                }}
              />
              {state.errors?.password && (
                <div style={{ fontSize: 12.5, color: "#E8A0A0", marginTop: 5 }}>{state.errors.password[0]}</div>
              )}
            </div>

            {state.general && (
              <div style={{ background: "rgba(216,100,100,.14)", border: "1px solid rgba(216,100,100,.35)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 13.5, color: "#E8A0A0" }}>
                {state.general}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              style={{
                width: "100%", fontFamily: "var(--font-hanken)", fontWeight: 700, fontSize: 15,
                color: "#1E282A", background: "linear-gradient(135deg,#E3A878 0%,#C8885A 100%)",
                border: "none", borderRadius: 14, padding: 15,
                cursor: pending ? "not-allowed" : "pointer",
                opacity: pending ? 0.7 : 1,
                marginBottom: 20,
                boxShadow: "0 8px 24px rgba(227,168,120,.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <span>{pending ? "Creando cuenta…" : "Crear cuenta"}</span>
              {!pending && <span style={{ fontSize: 17 }}>→</span>}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(236,230,216,.1)" }} />
              <span style={{ fontSize: 12, color: "rgba(236,230,216,.28)" }}>o</span>
              <div style={{ flex: 1, height: 1, background: "rgba(236,230,216,.1)" }} />
            </div>

            <div style={{ textAlign: "center", fontSize: 14, color: "#7A8FA0" }}>
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" style={{ color: "#7EB8D8", fontWeight: 600, marginLeft: 4, textDecoration: "none" }}>
                Inicia sesión
              </Link>
            </div>
          </form>
        </div>

        <div style={{ marginTop: 18, fontSize: 11.5, color: "rgba(236,230,216,.28)", textAlign: "center" }}>
          Al continuar aceptas los términos de uso.
        </div>
      </div>
    </div>
  );
}
