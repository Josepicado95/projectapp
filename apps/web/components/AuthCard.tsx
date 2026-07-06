"use client";

import { useActionState, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import ThreeBackground from "@/components/background/ThreeBackground";
import type { MomentTheme } from "@/lib/theme";
import { loginAction } from "@/app/actions/auth";
import { registerAction } from "@/app/actions/auth";

type Mode = "login" | "register";

type LoginState    = { error?: string; success?: boolean };
type RegisterState = { errors?: { name?: string[]; email?: string[]; password?: string[] }; general?: string };

// Separate component so useSearchParams is isolated in its own Suspense boundary
function RegisteredBanner() {
  const sp = useSearchParams();
  if (sp.get("registered") !== "true") return null;
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

function getInputBase(theme: MomentTheme): React.CSSProperties {
  return {
    width: "100%",
    fontFamily: "var(--font-hanken), sans-serif",
    fontSize: 15,
    color: theme.cardInk,
    background: theme.trackBg,
    border: `1px solid ${theme.glassBorder}`,
    borderRadius: 13,
    padding: "13px 15px",
    boxSizing: "border-box",
    colorScheme: theme.key === "noche" ? "dark" : "light",
  };
}

export default function AuthCard({ initialMode = "login" as Mode, theme }: { initialMode?: Mode; theme: MomentTheme }) {
  const [mode, setMode]               = useState<Mode>(initialMode);
  const [transitioning, setTransitioning] = useState(false);
  const router = useRouter();

  const [loginState,    loginFormAction,    loginPending]    = useActionState<LoginState,    FormData>(loginAction,    {});
  const [registerState, registerFormAction, registerPending] = useActionState<RegisterState, FormData>(registerAction, {});

  useEffect(() => {
    if (!loginState.success) return;
    setTransitioning(true);
    const t = setTimeout(() => router.push("/"), 700);
    return () => clearTimeout(t);
  }, [loginState.success, router]);

  const isLogin  = mode === "login";
  const pending  = isLogin ? loginPending : registerPending;
  const title    = isLogin ? "Bienvenido de vuelta"            : "Empieza tu aventura";
  const subtitle = isLogin ? "Continúa donde lo dejaste."      : "Crea tu cuenta y comienza el camino.";
  const btnLabel = isLogin ? "Entrar"                          : "Crear cuenta";
  const toggleMsg = isLogin ? "¿No tienes cuenta?"             : "¿Ya tienes cuenta?";
  const toggleCta = isLogin ? "Créala aquí"                    : "Inicia sesión";

  return (
    <div style={{
      position: "relative", width: "100%", height: "100vh", overflow: "hidden",
      fontFamily: "var(--font-hanken), sans-serif",
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes av-dawn    { 0%{opacity:1} 55%{opacity:.65} 100%{opacity:0} }
        @keyframes lg-rise    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lg-fade-in { from{opacity:0} to{opacity:1} }
        .av-input:focus { outline:none; border-color:rgba(146,199,230,.6)!important; box-shadow:0 0 0 3px rgba(91,155,209,.14); }
        .av-input::placeholder { color:rgba(236,230,216,.3); }
      `}} />

      <ThreeBackground moment={theme.key} isStatic />

      {/* Dawn curtain — fades out on mount */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 8, pointerEvents: "none",
        background: theme.skyGradient,
        animation: "av-dawn 3.8s cubic-bezier(.4,0,.15,1) .15s forwards",
      }} />

      {/* Content layer */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 9,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>

        {/* Logo + wordmark */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          marginBottom: 24, animation: "lg-rise .5s ease both",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "radial-gradient(circle at 60% 35%, #F0EAD8, #9DB6A4)",
            boxShadow: "0 0 24px rgba(240,234,216,.35), 0 4px 16px rgba(0,0,0,.3)",
          }} />
          <div style={{
            fontFamily: "var(--font-schibsted), sans-serif", fontWeight: 700,
            fontSize: 18, color: "#F2EFE6", letterSpacing: ".02em",
            textShadow: "0 1px 6px rgba(0,0,0,.4)",
          }}>
            Aventuras
          </div>
        </div>

        {/* Glass card */}
        <div style={{
          width: "100%", maxWidth: 420,
          background: theme.glassBgStrong,
          backdropFilter: "blur(28px) saturate(1.3)",
          WebkitBackdropFilter: "blur(28px) saturate(1.3)",
          border: `1px solid ${theme.glassBorder}`,
          borderRadius: 28,
          boxShadow: `0 32px 80px ${theme.glassShadow}, inset 0 1px 0 ${theme.glassInner}`,
          padding: "36px 34px 32px",
          animation: "lg-rise .55s ease .08s both",
        }}>

          <div style={{
            fontFamily: "var(--font-schibsted), sans-serif", fontWeight: 700,
            fontSize: 26, color: theme.headerInk, lineHeight: 1.15, marginBottom: 6,
          }}>
            {title}
          </div>
          <div style={{ fontSize: 14, color: theme.headerSub, marginBottom: 28, lineHeight: 1.4 }}>
            {subtitle}
          </div>

          {/* "Just registered" banner — login mode only */}
          {isLogin && (
            <Suspense>
              <RegisteredBanner />
            </Suspense>
          )}

          {/* ── REGISTER FORM ── */}
          {!isLogin && (
            <form action={registerFormAction}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, color: "#7FA8C4", marginBottom: 7 }}>
                  Nombre
                </label>
                <input
                  name="name" type="text" required placeholder="Tu nombre"
                  className="av-input"
                  style={{ ...getInputBase(theme), borderColor: registerState.errors?.name ? "rgba(216,100,100,.5)" : undefined }}
                />
                {registerState.errors?.name && (
                  <p style={{ fontSize: 12.5, color: "#E8A0A0", marginTop: 5 }}>{registerState.errors.name[0]}</p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, color: "#7FA8C4", marginBottom: 7 }}>
                  Email
                </label>
                <input
                  name="email" type="email" required placeholder="tu@email.com"
                  className="av-input"
                  style={{ ...getInputBase(theme), borderColor: registerState.errors?.email ? "rgba(216,100,100,.5)" : undefined }}
                />
                {registerState.errors?.email && (
                  <p style={{ fontSize: 12.5, color: "#E8A0A0", marginTop: 5 }}>{registerState.errors.email[0]}</p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, color: "#7FA8C4", marginBottom: 7 }}>
                  Contraseña
                </label>
                <input
                  name="password" type="password" required placeholder="••••••••"
                  className="av-input"
                  style={{ ...getInputBase(theme), borderColor: registerState.errors?.password ? "rgba(216,100,100,.5)" : undefined }}
                />
                {registerState.errors?.password && (
                  <p style={{ fontSize: 12.5, color: "#E8A0A0", marginTop: 5 }}>{registerState.errors.password[0]}</p>
                )}
              </div>

              {registerState.general && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginBottom: 18,
                  background: "rgba(220,80,80,.12)", border: "1px solid rgba(220,80,80,.28)",
                  borderRadius: 11, padding: "10px 13px",
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
                  <span style={{ fontSize: 13, color: "#F0A0A0" }}>{registerState.general}</span>
                </div>
              )}

              <button type="submit" disabled={pending} style={{
                width: "100%", fontFamily: "var(--font-hanken), sans-serif", fontWeight: 700,
                fontSize: 15, color: "#1E282A",
                background: pending ? "rgba(227,168,120,.5)" : "linear-gradient(135deg,#E3A878 0%,#C8885A 100%)",
                border: "none", borderRadius: 14, padding: 15,
                cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.7 : 1,
                marginBottom: 20, boxShadow: "0 8px 24px rgba(227,168,120,.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <span>{pending ? "Creando cuenta…" : btnLabel}</span>
                {!pending && <span style={{ fontSize: 16 }}>→</span>}
              </button>
            </form>
          )}

          {/* ── LOGIN FORM ── */}
          {isLogin && (
            <form action={loginFormAction}>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="lg-email" style={{ display: "block", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, color: "#7FA8C4", marginBottom: 7 }}>
                  Email
                </label>
                <input
                  id="lg-email" name="email" type="email" required placeholder="tu@email.com"
                  className="av-input" style={getInputBase(theme)}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label htmlFor="lg-password" style={{ display: "block", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, color: "#7FA8C4", marginBottom: 7 }}>
                  Contraseña
                </label>
                <input
                  id="lg-password" name="password" type="password" required placeholder="••••••••"
                  className="av-input" style={getInputBase(theme)}
                />
              </div>

              {loginState.error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginBottom: 18,
                  background: "rgba(220,80,80,.12)", border: "1px solid rgba(220,80,80,.28)",
                  borderRadius: 11, padding: "10px 13px",
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
                  <span style={{ fontSize: 13, color: "#F0A0A0" }}>{loginState.error}</span>
                </div>
              )}

              <button type="submit" disabled={pending} style={{
                width: "100%", fontFamily: "var(--font-hanken), sans-serif", fontWeight: 700,
                fontSize: 15, color: "#1E282A",
                background: pending ? "rgba(227,168,120,.5)" : "linear-gradient(135deg,#E3A878 0%,#C8885A 100%)",
                border: "none", borderRadius: 14, padding: 15,
                cursor: pending ? "wait" : "pointer",
                marginBottom: 20, boxShadow: "0 8px 24px rgba(227,168,120,.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "transform .18s ease, box-shadow .18s ease",
              }}>
                <span>{pending ? "Entrando…" : btnLabel}</span>
                {!pending && <span style={{ fontSize: 16 }}>→</span>}
              </button>
            </form>
          )}

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(236,230,216,.1)" }} />
            <span style={{ fontSize: 12, color: "rgba(236,230,216,.28)" }}>o</span>
            <div style={{ flex: 1, height: 1, background: "rgba(236,230,216,.1)" }} />
          </div>

          {/* Mode toggle */}
          <div style={{ textAlign: "center", fontSize: 14, color: theme.cardSub }}>
            {toggleMsg}{" "}
            <button
              type="button"
              onClick={() => setMode(isLogin ? "register" : "login")}
              style={{
                background: "none", border: "none", padding: 0, marginLeft: 4,
                color: "#7EB8D8", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              {toggleCta}
            </button>
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

      {/* Transition curtain — aparece al hacer login exitoso */}
      {transitioning && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99, pointerEvents: "none",
          background: theme.skyGradient,
          animation: "lg-fade-in 600ms cubic-bezier(.4,0,.15,1) forwards",
        }} />
      )}
    </div>
  );
}
