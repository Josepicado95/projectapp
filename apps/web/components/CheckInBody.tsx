/**
 * CheckInBody — Cinematic multi-step check-in UI.
 */
"use client";

import { useState, useEffect, useRef } from "react";
import ForestBackground from "@/components/ForestBackground";

type MetricKey = "energy" | "mood" | "stress" | "sleep";
type Values    = Record<MetricKey, number>;

type CheckInPoint = { date: string; energy: number; mood: number; stress: number; sleep: number };

type Props = { userName: string };

const METRICS = [
  { key: "energy" as MetricKey, label: "Energía", icon: "⚡", color: "#E3A878",
    question: "¿Cuánta energía sientes hoy?",
    hint:     "Cómo se siente tu cuerpo en este momento.",
    low: "Sin fuerza", high: "Rebosante",
    levels: ["Sin fuerza","Cansado","Normal","Bastante","Rebosante"] },
  { key: "mood"   as MetricKey, label: "Ánimo",   icon: "🌤", color: "#7EB8D8",
    question: "¿Cómo está tu estado de ánimo?",
    hint:     "Tu sensación emocional general de hoy.",
    low: "Muy bajo", high: "Excelente",
    levels: ["Muy bajo","Algo bajo","Estable","Bien","Excelente"] },
  { key: "stress" as MetricKey, label: "Estrés",  icon: "🌀", color: "#C48FB4",
    question: "¿Cuánto estrés estás cargando?",
    hint:     "Tensión mental o sensación de estar desbordado.",
    low: "Sin estrés", high: "Saturado",
    levels: ["Sin estrés","Poco","Moderado","Bastante","Saturado"] },
  { key: "sleep"  as MetricKey, label: "Sueño",   icon: "🌙", color: "#7E9A86",
    question: "¿Cómo dormiste anoche?",
    hint:     "Calidad y descanso del sueño de la noche pasada.",
    low: "Muy mal", high: "Muy bien",
    levels: ["Muy mal","Mal","Regular","Bien","Muy bien"] },
] as const;

const WEEK_DAYS = ["L","M","X","J","V","S","D"];

type LoadState = "loading" | "ready" | "error";
type SaveState = { status: "idle" | "saving" | "success" | "error"; message?: string; error?: string };

export default function CheckInBody({ userName }: Props) {
  const [loadState,  setLoadState]  = useState<LoadState>("loading");
  const [saveState,  setSaveState]  = useState<SaveState>({ status: "idle" });

  const [step,       setStep]       = useState<number>(0);
  const [direction,  setDirection]  = useState<"forward"|"back">("forward");
  const [animKey,    setAnimKey]    = useState(0);
  const [recentWeek, setRecentWeek] = useState<CheckInPoint[]>([]);
  const [values,     setValues]     = useState<Values>({ energy: 3, mood: 3, stress: 3, sleep: 3 });

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [todayRes, weekRes] = await Promise.all([
          fetch("/api/mobile/checkins?today=true"),
          fetch("/api/mobile/checkins?days=7"),
        ]);
        if (todayRes.status === 401 || weekRes.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!todayRes.ok || !weekRes.ok) throw new Error("load_failed");

        const todayData: { checkIn: Values | null } = await todayRes.json();
        const weekData: CheckInPoint[] = await weekRes.json();
        if (cancelled) return;

        setRecentWeek(weekData.map((c) => ({
          date: c.date.slice(0, 10),
          energy: c.energy,
          mood: c.mood,
          stress: c.stress,
          sleep: c.sleep,
        })));

        if (todayData.checkIn) {
          setValues(todayData.checkIn);
          setStep(5);
        }
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveState({ status: "saving" });
    try {
      const res = await fetch("/api/mobile/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveState({ status: "error", error: body?.error?.message ?? "No se pudo guardar el check-in." });
        return;
      }
      setSaveState({
        status: "success",
        message: res.status === 201 ? "¡Check-in guardado!" : "¡Check-in actualizado!",
      });
      setStep(5);
    } catch {
      setSaveState({ status: "error", error: "No se pudo guardar el check-in." });
    }
  }

  function goTo(next: number, dir: "forward" | "back") {
    setDirection(dir);
    setAnimKey(k => k + 1);
    setStep(next);
  }

  const now = new Date();
  const todayDow = now.getDay();
  const weekBars = recentWeek.slice(-7).map((c, i, arr) => {
    const offset   = (todayDow - (arr.length - 1 - i) + 7) % 7;
    const dayLabel = WEEK_DAYS[offset === 0 ? 6 : offset - 1];
    const avg      = (c.energy + c.mood + c.sleep) / 3;
    const barH     = Math.max(6, Math.round((avg / 5) * 28));
    const color    = avg >= 4 ? "#7E9A86" : avg >= 3 ? "#7EB8D8" : avg >= 2 ? "#E3A878" : "#C48FB4";
    return { day: dayLabel, barH, color };
  });

  const dateLabel = now.toLocaleDateString("es-ES", { weekday:"long", day:"numeric", month:"long" });

  const metricIdx = step - 1;
  const metric    = step >= 1 && step <= 4 ? METRICS[metricIdx] : null;

  const anim = direction === "forward"
    ? `ci-enterR${animKey % 2 === 0 ? "A" : "B"}`
    : `ci-enterL${animKey % 2 === 0 ? "A" : "B"}`;

  const cardStyle: React.CSSProperties = {
    background: "rgba(14,20,36,.84)",
    backdropFilter: "blur(28px) saturate(1.3)",
    WebkitBackdropFilter: "blur(28px) saturate(1.3)",
    border: "1px solid rgba(236,230,216,.16)",
    borderRadius: 28,
    boxShadow: "0 32px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(236,230,216,.1)",
    animation: `${anim} .4s cubic-bezier(.2,0,0,1) both`,
  };

  const loadingCardStyle: React.CSSProperties = {
    background: "rgba(14,20,36,.84)",
    backdropFilter: "blur(28px) saturate(1.3)",
    WebkitBackdropFilter: "blur(28px) saturate(1.3)",
    border: "1px solid rgba(236,230,216,.16)",
    borderRadius: 28,
    boxShadow: "0 32px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(236,230,216,.1)",
  };

  if (loadState === "loading" || loadState === "error") {
    return (
      <div style={{ position:"relative", width:"100%", height:"100vh", overflow:"hidden", fontFamily: "var(--font-hanken), sans-serif" }}>
        <ForestBackground static />
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}>
          <div style={{ ...loadingCardStyle, width:"100%", maxWidth:440, padding:"48px 44px", textAlign:"center" }}>
            {loadState === "loading" ? (
              <div style={{ fontSize:15, color:"#7A8FA0" }}>Cargando tu check-in…</div>
            ) : (
              <>
                <div style={{ fontSize:15, color:"#F0A0A0", marginBottom:16 }}>No se pudo cargar tu check-in.</div>
                <button
                  onClick={() => window.location.reload()}
                  style={{ fontFamily:"var(--font-hanken)", fontWeight:700, fontSize:14, color:"#1E282A", background:"#E3A878", border:"none", borderRadius:12, padding:"10px 20px", cursor:"pointer" }}
                >
                  Reintentar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:"relative", width:"100%", height:"100vh", overflow:"hidden",
      fontFamily: "var(--font-hanken), sans-serif" }}>

      <ForestBackground static />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ci-pulse   { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
        @keyframes ci-checkIn { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
        @keyframes ci-enterRA { from{opacity:0;transform:translateX(36px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ci-enterRB { from{opacity:0;transform:translateX(36px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ci-enterLA { from{opacity:0;transform:translateX(-36px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ci-enterLB { from{opacity:0;transform:translateX(-36px)} to{opacity:1;transform:translateX(0)} }
      `}} />

      {/* Layout */}
      <div style={{ position:"absolute", inset:0, display:"flex", zIndex:1 }}>

        {/* Nav rail */}
        <nav className="av-nav-rail" style={{ flexShrink:0, width:84, background:"rgba(10,15,26,.66)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", borderRight:"1px solid rgba(236,230,216,.1)", display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 0 22px" }}>
          <div style={{ width:28, height:28, borderRadius:9, background:"radial-gradient(circle at 60% 35%, #F0EAD8, #9DB6A4)", boxShadow:"0 0 14px rgba(240,234,216,.26)", marginBottom:10, flexShrink:0 }} />
          <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"center" }}>
            {[
              { icon:"⛰", label:"Aventuras", href:"/",         active:false },
              { icon:"♡", label:"Check-in",  href:"/checkin",  active:true  },
              { icon:"◷", label:"Progreso",  href:"/progress", active:false },
            ].map(item => (
              <a key={item.href} href={item.href} style={{ width:56, height:56, borderRadius:15, textDecoration:"none", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4,
                ...(item.active
                  ? { background:"rgba(91,155,209,.2)", border:"1px solid rgba(146,199,230,.45)", color:"#CDE6F5" }
                  : { color:"#9FB4C6" }) }}>
                <span style={{ fontSize:18, lineHeight:1 }}>{item.icon}</span>
                <span style={{ fontSize:9, fontWeight:600 }}>{item.label}</span>
              </a>
            ))}
          </div>
          <div style={{ marginTop:"auto", width:38, height:38, borderRadius:"50%", background:"#E3A878", color:"#1E282A", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:600, fontSize:14 }}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </nav>

        {/* Centered content */}
        <main style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>

          {/* STEP 0: Intro */}
          {step === 0 && (
            <div style={{ ...cardStyle, width:"100%", maxWidth:440, padding:"48px 44px" }}>
              <div style={{ textAlign:"center", marginBottom:36 }}>
                <div style={{ fontSize:44, marginBottom:20, animation:"ci-pulse 3s ease-in-out infinite" }}>♡</div>
                <div style={{ fontFamily:"var(--font-schibsted)", fontWeight:700, fontSize:28, color:"#F2EFE6", lineHeight:1.2, marginBottom:8 }}>
                  Hola, {userName.split(" ")[0]}.
                </div>
                <div style={{ fontSize:15, color:"#7A8FA0", marginBottom:6, textTransform:"capitalize" }}>{dateLabel}</div>
                <div style={{ fontSize:14, color:"#4E5E68", lineHeight:1.5 }}>4 preguntas, menos de un minuto.<br />Solo para ti.</div>
              </div>

              {weekBars.length > 0 && (
                <div style={{ display:"flex", gap:8, justifyContent:"center", alignItems:"flex-end", marginBottom:40 }}>
                  {weekBars.map((wb, i) => (
                    <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                      <div style={{ width:28, height:wb.barH, borderRadius:4, background:wb.color }} />
                      <span style={{ fontSize:9, color:"#4E6070", fontWeight:600 }}>{wb.day}</span>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" onClick={() => goTo(1, "forward")}
                style={{ width:"100%", fontFamily:"var(--font-hanken)", fontWeight:700, fontSize:15, color:"#1E282A", background:"linear-gradient(135deg,#E3A878 0%,#C8885A 100%)", border:"none", borderRadius:14, padding:15, cursor:"pointer", boxShadow:"0 8px 24px rgba(227,168,120,.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <span>Empezar</span><span style={{ fontSize:17 }}>→</span>
              </button>
            </div>
          )}

          {/* STEPS 1–4: Metric screens */}
          {step >= 1 && step <= 4 && metric && (
            <div style={{ ...cardStyle, width:"100%", maxWidth:520, padding:"40px 48px" }}>

              {/* Progress indicators */}
              <div style={{ display:"flex", gap:8, marginBottom:36 }}>
                {METRICS.map((m, i) => (
                  <div key={m.key} style={{ flex:1, height:4, borderRadius:4, transition:"background .3s ease",
                    background: i < step - 1 ? m.color : i === step - 1 ? m.color : "rgba(236,230,216,.14)" }} />
                ))}
              </div>

              {/* Icon + question */}
              <div style={{ textAlign:"center", marginBottom:38 }}>
                <div style={{ fontSize:52, marginBottom:16, lineHeight:1 }}>{metric.icon}</div>
                <div style={{ fontFamily:"var(--font-schibsted)", fontWeight:700, fontSize:22, color:"#F2EFE6", lineHeight:1.25, marginBottom:6 }}>{metric.question}</div>
                <div style={{ fontSize:13, color:"#4E5E68" }}>{metric.hint}</div>
              </div>

              {/* Dot selectors */}
              <div style={{ display:"flex", gap:12, justifyContent:"center", alignItems:"center", marginBottom:14 }}>
                {[1,2,3,4,5].map(n => {
                  const sel  = n === values[metric.key];
                  const done = n  <  values[metric.key];
                  return (
                    <button key={n} type="button" onClick={() => setValues(v => ({ ...v, [metric.key]: n }))}
                      style={{ width:54, height:54, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                        background: sel ? metric.color : done ? metric.color + "44" : "rgba(236,230,216,.08)",
                        border: `2px solid ${sel ? metric.color : "rgba(236,230,216,.16)"}`,
                        boxShadow: sel ? `0 0 24px ${metric.color}66, 0 0 8px ${metric.color}44` : "none",
                        transform: sel ? "scale(1.2)" : "scale(1)",
                        transition: "all .22s cubic-bezier(.2,0,0,1)" }}>
                      <span style={{ fontSize:17, fontWeight:700, color: sel ? "#1E2830" : done ? metric.color + "bb" : "#4E6070" }}>{n}</span>
                    </button>
                  );
                })}
              </div>

              {/* Level label */}
              <div style={{ textAlign:"center", height:28, marginBottom:12 }}>
                <span style={{ fontSize:15, fontWeight:600, color:metric.color }}>
                  {metric.levels[values[metric.key] - 1]}
                </span>
              </div>

              {/* Edge labels */}
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:38, padding:"0 6px" }}>
                <span style={{ fontSize:11.5, color:"#3E4E58" }}>{metric.low}</span>
                <span style={{ fontSize:11.5, color:"#3E4E58" }}>{metric.high}</span>
              </div>

              {/* Nav buttons */}
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={() => goTo(step - 1, "back")}
                  style={{ flexShrink:0, width:52, height:52, borderRadius:14, background:"rgba(236,230,216,.08)", border:"1px solid rgba(236,230,216,.16)", color:"#8A9AA6", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  ←
                </button>

                {step < 4 ? (
                  <button type="button" onClick={() => goTo(step + 1, "forward")}
                    style={{ flex:1, fontFamily:"var(--font-hanken)", fontWeight:700, fontSize:15, color:"#1E282A", background:`linear-gradient(135deg,${metric.color} 0%,${metric.color}cc 100%)`, border:"none", borderRadius:14, padding:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <span>Siguiente</span><span style={{ fontSize:17 }}>→</span>
                  </button>
                ) : (
                  <form ref={formRef} onSubmit={handleSubmit} style={{ flex:1 }}>
                    <button type="submit" disabled={saveState.status === "saving"}
                      style={{ width:"100%", fontFamily:"var(--font-hanken)", fontWeight:700, fontSize:15, color:"#1E282A", background: saveState.status === "saving" ? "rgba(126,154,134,.5)" : "linear-gradient(135deg,#7E9A86 0%,#5E7A66 100%)", border:"none", borderRadius:14, padding:15, cursor: saveState.status === "saving" ? "wait" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 8px 24px rgba(126,154,134,.3)" }}>
                      <span>{saveState.status === "saving" ? "Guardando..." : "Guardar check-in"}</span>
                      {saveState.status !== "saving" && <span style={{ fontSize:17 }}>✓</span>}
                    </button>
                  </form>
                )}
              </div>

              {saveState.status === "error" && (
                <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:8, background:"rgba(220,80,80,.12)", border:"1px solid rgba(220,80,80,.28)", borderRadius:11, padding:"10px 13px" }}>
                  <span style={{ fontSize:13, color:"#F0A0A0" }}>{saveState.error}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Summary */}
          {step === 5 && (
            <div style={{ ...cardStyle, width:"100%", maxWidth:480, padding:"40px 44px" }}>
              <div style={{ textAlign:"center", marginBottom:30 }}>
                <div style={{ width:68, height:68, borderRadius:"50%", background:"rgba(126,154,134,.15)", border:"2px solid rgba(126,154,134,.4)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:26, animation:"ci-checkIn .5s cubic-bezier(.2,0,0,1) both" }}>✓</div>
                <div style={{ fontFamily:"var(--font-schibsted)", fontWeight:700, fontSize:24, color:"#F2EFE6", marginBottom:6 }}>
                  {saveState.message ?? "Check-in guardado"}
                </div>
                <div style={{ fontSize:14, color:"#7A8FA0" }}>Tu momento de hoy está registrado.</div>
              </div>

              {/* 4 metric mini-cards */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:28 }}>
                {METRICS.map(m => {
                  const val = values[m.key];
                  return (
                    <div key={m.key} style={{ background:"rgba(236,230,216,.06)", border:"1px solid rgba(236,230,216,.1)", borderRadius:16, padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:18, lineHeight:1 }}>{m.icon}</span>
                        <span style={{ fontSize:11, color:"#7A8FA0", fontWeight:600, letterSpacing:".05em" }}>{m.label}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                        <span style={{ fontFamily:"var(--font-schibsted)", fontSize:26, fontWeight:700, color:"#F2EFE6", lineHeight:1 }}>{val}</span>
                        <span style={{ fontSize:12, color:m.color, fontWeight:600 }}>{m.levels[val - 1]}</span>
                      </div>
                      <div style={{ display:"flex", gap:4, marginTop:8 }}>
                        {[1,2,3,4,5].map(n => (
                          <div key={n} style={{ flex:1, height:3, borderRadius:3, background: n <= val ? m.color : "rgba(236,230,216,.12)" }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <a href="/" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", fontFamily:"var(--font-hanken)", fontWeight:700, fontSize:15, color:"#1E282A", background:"linear-gradient(135deg,#E3A878 0%,#C8885A 100%)", textDecoration:"none", borderRadius:14, padding:15, boxShadow:"0 8px 24px rgba(227,168,120,.3)" }}>
                <span>Ver mi dashboard</span><span style={{ fontSize:17 }}>→</span>
              </a>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
