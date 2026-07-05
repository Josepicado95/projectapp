/**
 * ProgressBody — "Mi Progreso" screen.
 * Design: Progreso - Aventuras.dc.html
 */
"use client";

import ForestBackground from "@/components/ForestBackground";
import { toDailyLatest } from "@/lib/checkin-utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type Mission   = { id: number; label: string; completed: boolean };
type Adventure = { id: number; title: string; missions: Mission[] };
type CheckIn   = { date: string; energy: number; mood: number; stress: number; sleep: number };

type Props = {
  adventures:    Adventure[];
  checkIns:      CheckIn[];
  userName:      string;
  streak:        number;
  logoutAction?: () => Promise<void>;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const ADVENTURE_COLORS = ["#E3A878", "#7E9A86", "#7EB8D8", "#C48FB4", "#9B8DC4"];

const METRIC_DEFS = [
  { key: "energy" as const, label: "Energía", icon: "⚡", color: "#E3A878", inverted: false,
    levels: ["Sin fuerza","Cansado","Normal","Bastante","Rebosante"] },
  { key: "mood"   as const, label: "Ánimo",   icon: "🌤", color: "#7EB8D8", inverted: false,
    levels: ["Muy bajo","Algo bajo","Estable","Bien","Excelente"] },
  { key: "stress" as const, label: "Estrés",  icon: "🌀", color: "#C48FB4", inverted: true,
    levels: ["Sin estrés","Poco","Moderado","Bastante","Saturado"] },
  { key: "sleep"  as const, label: "Sueño",   icon: "🌙", color: "#7E9A86", inverted: false,
    levels: ["Muy mal","Mal","Regular","Bien","Muy bien"] },
] as const;

const WEEK_DAYS = ["L","M","X","J","V","S","D"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sparkPath(vals: number[], w = 160, h = 46, pad = 5) {
  if (vals.length < 2) return { line: "", area: "", lastX: w - pad, lastY: h / 2 };
  const pts = vals.map((v, i) => {
    const x = +(pad + (i / (vals.length - 1)) * (w - pad * 2)).toFixed(1);
    const y = +(pad + ((5 - v) / 4) * (h - pad * 2)).toFixed(1);
    return [x, y] as [number, number];
  });
  const line = "M " + pts.map(p => p.join(" ")).join(" L ");
  const last = pts[pts.length - 1];
  const area = `${line} L ${last[0]} ${h} L ${pts[0][0]} ${h} Z`;
  return { line, area, lastX: last[0], lastY: last[1] };
}

function trendInfo(series: number[], inverted: boolean) {
  const n = Math.min(5, Math.floor(series.length / 2));
  if (n === 0) return { arrow: "→", color: "#5A6A78" };
  const recent = series.slice(-n).reduce((a, b) => a + b, 0) / n;
  const old    = series.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const diff   = inverted ? old - recent : recent - old;
  if (diff >  0.25) return { arrow: "↑", color: "#7E9A86" };
  if (diff < -0.25) return { arrow: "↓", color: "#C48FB4" };
  return { arrow: "→", color: "#5A6A78" };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProgressBody({ adventures, checkIns, userName, streak, logoutAction }: Props) {
  const now = new Date();
  const monthStr = now.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  // Metric cards data
  const metrics = METRIC_DEFS.map(m => {
    const series = checkIns.map(c => c[m.key]);
    const { line: linePath, area: areaPath, lastX, lastY } = sparkPath(series);
    const avg = series.length
      ? +(series.reduce((a, b) => a + b, 0) / series.length).toFixed(1)
      : 0;
    const todayVal   = series[series.length - 1] ?? 0;
    const todayLabel = todayVal > 0 ? m.levels[(todayVal - 1) as 0 | 1 | 2 | 3 | 4] : "—";
    const { arrow: trendArrow, color: trendColor } = trendInfo(series, m.inverted);
    return { ...m, linePath, areaPath, lastX, lastY, avg, todayVal, todayLabel, trendArrow, trendColor };
  });

  // Last 7 days bars — collapse to one entry per calendar day first, since
  // checkIns may contain multiple check-ins for the same day.
  const last7 = toDailyLatest(checkIns).slice(-7);
  const todayDow = now.getDay();
  const weekBars = last7.map((c, i) => {
    const offset   = (todayDow - (last7.length - 1 - i) + 7) % 7;
    const dayLabel = WEEK_DAYS[offset === 0 ? 6 : offset - 1];
    const avg      = (c.energy + c.mood + c.sleep) / 3;
    const barH     = Math.max(6, Math.round((avg / 5) * 36));
    const barColor = avg >= 4 ? "#7E9A86" : avg >= 3 ? "#7EB8D8" : avg >= 2 ? "#E3A878" : "#C48FB4";
    return { day: dayLabel, barH, barColor };
  });

  // Adventure cards
  const adventureCards = adventures.slice(0, 5).map((a, idx) => {
    const color     = ADVENTURE_COLORS[idx % ADVENTURE_COLORS.length];
    const total     = a.missions.length;
    const completed = a.missions.filter(m => m.completed).length;
    const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { ...a, color, total, completed, pct };
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden",
      background: "linear-gradient(180deg,#0E1630 0%,#1B2647 42%,#27375E 74%,#34496F 100%)",
      fontFamily: "var(--font-hanken), sans-serif" }}>

      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(236,230,216,.18); border-radius: 4px; }
        @keyframes av-dawn { 0%{opacity:1} 55%{opacity:.65} 100%{opacity:0} }
      `}} />

      <ForestBackground />

      {/* Dawn curtain */}
      <div style={{ position: "absolute", inset: 0, zIndex: 8, pointerEvents: "none",
        background: "linear-gradient(180deg,#0E1630 0%,#1B2647 42%,#27375E 74%,#34496F 100%)",
        animation: "av-dawn 3.8s cubic-bezier(.4,0,.15,1) .15s forwards" }} />

      {/* ── Layout ── */}
      <div style={{ position:"absolute", inset:0, display:"flex", zIndex:1 }}>

        {/* Nav rail */}
        <nav style={{ flexShrink:0, width:84, background:"rgba(10,15,26,.66)", backdropFilter:"blur(12px)",
          WebkitBackdropFilter:"blur(12px)", borderRight:"1px solid rgba(236,230,216,.1)",
          display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 0 22px" }}>
          <div style={{ width:28, height:28, borderRadius:9,
            background:"radial-gradient(circle at 60% 35%, #F0EAD8, #9DB6A4)",
            boxShadow:"0 0 14px rgba(240,234,216,.26)", marginBottom:10, flexShrink:0 }} />
          <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"center" }}>
            {[
              { icon:"⛰", label:"Aventuras", href:"/"         },
              { icon:"♡", label:"Check-in",  href:"/checkin"  },
              { icon:"◷", label:"Progreso",  href:"/progress", active:true },
            ].map(item => (
              <a key={item.href} href={item.href} style={{ width:56, height:56, borderRadius:15,
                textDecoration:"none", display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", gap:4,
                ...(item.active
                  ? { background:"rgba(91,155,209,.2)", border:"1px solid rgba(146,199,230,.45)", color:"#CDE6F5" }
                  : { color:"#9FB4C6" }) }}>
                <span style={{ fontSize:18, lineHeight:1 }}>{item.icon}</span>
                <span style={{ fontSize:9, fontWeight:600 }}>{item.label}</span>
              </a>
            ))}
          </div>
          <div style={{ marginTop:"auto" }}>
            {logoutAction ? (
              <form action={logoutAction}>
                <button type="submit" title="Cerrar sesión" style={{ width:38, height:38,
                  borderRadius:"50%", background:"#E3A878", color:"#1E282A", border:"none",
                  cursor:"pointer", fontWeight:600, fontSize:14,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {userName.charAt(0).toUpperCase()}
                </button>
              </form>
            ) : (
              <div style={{ width:38, height:38, borderRadius:"50%", background:"#E3A878",
                color:"#1E282A", display:"flex", alignItems:"center", justifyContent:"center",
                fontWeight:600, fontSize:14 }}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </nav>

        {/* Scrollable content */}
        <main style={{ flex:1, minWidth:0, overflowY:"auto", padding:"28px 28px 48px" }}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
            <div>
              <h1 style={{ fontFamily:"var(--font-schibsted)", fontWeight:700, fontSize:24, color:"#F2EFE6", lineHeight:1.2 }}>Mi Progreso</h1>
              <p style={{ fontSize:13, color:"#5A6A78", marginTop:2, textTransform:"capitalize" }}>{monthStr}</p>
            </div>
            {streak > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:8,
                background:"rgba(227,168,120,.1)", border:"1px solid rgba(227,168,120,.28)",
                borderRadius:14, padding:"8px 14px" }}>
                <span style={{ fontSize:18, lineHeight:1 }}>🔥</span>
                <div>
                  <div style={{ fontFamily:"var(--font-schibsted)", fontWeight:700, fontSize:20, color:"#E3A878", lineHeight:1 }}>{streak}</div>
                  <div style={{ fontSize:10, color:"#8A7060", fontWeight:600, letterSpacing:".04em" }}>DÍAS SEGUIDOS</div>
                </div>
              </div>
            )}
          </div>

          {/* Two-column grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"start" }}>

            {/* ── LEFT: Bienestar ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <p style={{ fontSize:11, fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", color:"#4E6070" }}>
                Bienestar · 14 días
              </p>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {metrics.map(m => (
                  <div key={m.key} style={{ background:"rgba(14,20,36,.82)", backdropFilter:"blur(20px)",
                    WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(236,230,216,.12)",
                    borderRadius:20, padding:"16px 16px 14px", display:"flex", flexDirection:"column" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ fontSize:16, lineHeight:1 }}>{m.icon}</span>
                        <span style={{ fontSize:12, fontWeight:600, color:"#8A9AA6", letterSpacing:".04em" }}>{m.label}</span>
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, color:m.color,
                        background:"rgba(255,255,255,.06)", borderRadius:8, padding:"3px 8px" }}>
                        {m.todayVal}/5
                      </div>
                    </div>
                    <div style={{ height:52, marginBottom:10 }}>
                      <svg viewBox="0 0 160 46" style={{ width:"100%", height:"100%", overflow:"visible", display:"block" }}>
                        <path d={m.areaPath} fill={m.color} fillOpacity={0.13} />
                        <path d={m.linePath} fill="none" stroke={m.color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx={m.lastX} cy={m.lastY} r={3.5} fill={m.color} />
                        <circle cx={m.lastX} cy={m.lastY} r={6.5} fill={m.color} fillOpacity={0.22} />
                      </svg>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:11, color:"#4E6070" }}>Promedio</span>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <span style={{ fontFamily:"var(--font-schibsted)", fontSize:16, fontWeight:700, color:"#F2EFE6", lineHeight:1 }}>{m.avg}</span>
                        <span style={{ fontSize:14, color:m.trendColor, fontWeight:700, lineHeight:1 }}>{m.trendArrow}</span>
                      </div>
                    </div>
                    <div style={{ marginTop:5, fontSize:11, color:m.color, fontWeight:600, textAlign:"right" }}>{m.todayLabel}</div>
                  </div>
                ))}
              </div>

              {weekBars.length > 0 && (
                <div style={{ background:"rgba(14,20,36,.7)", backdropFilter:"blur(16px)",
                  WebkitBackdropFilter:"blur(16px)", border:"1px solid rgba(236,230,216,.1)",
                  borderRadius:18, padding:"16px 18px" }}>
                  <p style={{ fontSize:11, color:"#4E6070", fontWeight:600, letterSpacing:".06em", marginBottom:12 }}>ÚLTIMOS 7 DÍAS</p>
                  <div style={{ display:"flex", gap:6, alignItems:"flex-end" }}>
                    {weekBars.map((wb, i) => (
                      <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                        <div style={{ width:"100%", borderRadius:4, background:wb.barColor, height:wb.barH, transition:"height .3s ease" }} />
                        <span style={{ fontSize:9, color:"#3E4E58", fontWeight:600 }}>{wb.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Aventuras ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <p style={{ fontSize:11, fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", color:"#4E6070" }}>
                Aventuras activas
              </p>

              {adventureCards.length === 0 && (
                <div style={{ background:"rgba(14,20,36,.7)", border:"1px solid rgba(236,230,216,.1)",
                  borderRadius:20, padding:"28px 20px", textAlign:"center", color:"#4A5A64", fontSize:14 }}>
                  Aún no tienes aventuras. ¡Crea tu primera!
                </div>
              )}

              {adventureCards.map(a => (
                <div key={a.id} style={{ background:"rgba(14,20,36,.82)", backdropFilter:"blur(20px)",
                  WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(236,230,216,.12)",
                  borderRadius:20, padding:"18px 18px 16px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12, gap:8 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:a.color,
                        boxShadow:`0 0 8px ${a.color}88`, flexShrink:0, marginTop:4 }} />
                      <span style={{ fontFamily:"var(--font-schibsted)", fontWeight:600, fontSize:14,
                        color:"#ECE6D8", lineHeight:1.35 }}>{a.title}</span>
                    </div>
                    <span style={{ fontFamily:"var(--font-schibsted)", fontWeight:700, fontSize:18,
                      color:a.color, flexShrink:0, lineHeight:1 }}>{a.pct}%</span>
                  </div>
                  <div style={{ height:6, borderRadius:6, background:"rgba(236,230,216,.1)", marginBottom:4, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:6,
                      background:`linear-gradient(90deg,${a.color}99,${a.color})`,
                      width:`${a.pct}%`, transition:"width .5s cubic-bezier(.2,0,0,1)" }} />
                  </div>
                  <p style={{ fontSize:11, color:"#4A5A64", marginBottom:14 }}>{a.completed} de {a.total} misiones</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {a.missions.map(m => (
                      <div key={m.id} style={{ display:"flex", alignItems:"center", gap:9 }}>
                        <div style={{ flexShrink:0, width:18, height:18, borderRadius:"50%",
                          background: m.completed ? a.color : "rgba(236,230,216,.07)",
                          border: `1.5px solid ${m.completed ? a.color : "rgba(236,230,216,.2)"}`,
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {m.completed && <span style={{ fontSize:9, color:"#1E2830", fontWeight:700, lineHeight:1 }}>✓</span>}
                        </div>
                        <span style={{ fontSize:12, lineHeight:1.3,
                          color: m.completed ? "rgba(236,230,216,.82)" : "rgba(236,230,216,.3)" }}>
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
