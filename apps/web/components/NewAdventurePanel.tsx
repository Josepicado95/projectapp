"use client";

import { useState, useActionState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createAdventure } from "@/app/actions/adventures";
import { MISSION_LEVELS, hexToRgb } from "./MissionEditorModal";

const PALETTES = [
  "linear-gradient(180deg,#2C3A52 0%,#5E5670 60%,#A88098 100%)",
  "linear-gradient(180deg,#C7DBE4 0%,#9DB6A4 55%,#7E9A86 100%)",
  "linear-gradient(180deg,#F2D2A6 0%,#E3A878 55%,#C2825F 100%)",
  "linear-gradient(180deg,#2C2A4E 0%,#5A4E78 55%,#9A7E9E 100%)",
  "linear-gradient(180deg,#1E2C49 0%,#3E5A7E 55%,#7E9A86 100%)",
];

type Props = { fullWidth?: boolean };

export default function NewAdventurePanel({ fullWidth }: Props) {
  const [open, setOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftGradIdx, setDraftGradIdx] = useState(0);
  const [draftMissions, setDraftMissions] = useState<{ name: string; diff: number }[]>([]);
  const [missionInput, setMissionInput] = useState("");
  const [draftMissionLevel, setDraftMissionLevel] = useState(2);

  const [state, formAction, pending] = useActionState(createAdventure, {});

  useEffect(() => {
    if (state.message) {
      setOpen(false);
      setDraftTitle("");
      setDraftGradIdx(0);
      setDraftMissions([]);
      setMissionInput("");
      setDraftMissionLevel(2);
    }
  }, [state.message]);

  function addMission() {
    const v = missionInput.trim();
    if (!v) return;
    setDraftMissions((ms) => [...ms, { name: v, diff: draftMissionLevel }]);
    setMissionInput("");
  }

  const canCreate = draftTitle.trim().length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 15,
          color: "#1E282A", background: "#E3A878",
          border: "none", borderRadius: 14,
          padding: fullWidth ? "15px" : "11px 22px",
          width: fullWidth ? "100%" : undefined,
          cursor: "pointer", boxShadow: "0 10px 26px rgba(227,168,120,.28)",
          display: "flex", alignItems: "center",
          justifyContent: fullWidth ? "center" : "flex-start",
          gap: 9,
        }}
      >
        <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>+</span>
        Nueva aventura
      </button>

      {open && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(8,12,22,.55)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              animation: "av-riseA .2s ease both",
            }}
          />

          {/* Modal container (centra el form, no intercepta clics fuera) */}
          <div style={{
            position: "fixed", inset: 0, zIndex: 201,
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <form
              action={formAction}
              style={{
                pointerEvents: "auto",
                width: 520, maxHeight: "88vh", overflowY: "auto",
                background: "rgba(22,30,38,.88)",
                backdropFilter: "blur(26px) saturate(1.2)",
                WebkitBackdropFilter: "blur(26px) saturate(1.2)",
                border: "1px solid rgba(236,230,216,.18)",
                borderRadius: 26,
                boxShadow: "0 28px 70px rgba(0,0,0,.55), inset 0 1px 0 rgba(236,230,216,.12)",
                padding: "28px 30px",
                animation: "av-riseB .26s ease both",
                boxSizing: "border-box",
              }}
            >
              {/* ── Encabezado ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "#7FA8C4", fontWeight: 600 }}>
                    Empieza un nuevo viaje
                  </div>
                  <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 24, color: "#F2EFE6", marginTop: 4 }}>
                    Nueva aventura
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    flexShrink: 0, width: 34, height: 34, borderRadius: "50%",
                    background: "rgba(236,230,216,.08)", border: "1px solid rgba(236,230,216,.16)",
                    color: "#ECE6D8", fontSize: 16, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* ── Preview del paisaje ── */}
              <div style={{
                margin: "18px 0 22px", height: 96, borderRadius: 16, overflow: "hidden",
                position: "relative", background: PALETTES[draftGradIdx],
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)",
              }}>
                <div style={{ position: "absolute", right: 22, top: 18, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.7)" }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 34, background: "rgba(0,0,0,.18)", clipPath: "polygon(0 60%,30% 32%,60% 54%,100% 36%,100% 100%,0 100%)" }} />
                <div style={{ position: "absolute", left: 18, bottom: 14, fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 18, color: "#FBF8F1", textShadow: "0 1px 6px rgba(0,0,0,.4)" }}>
                  {draftTitle.trim() || "Tu aventura"}
                </div>
              </div>

              {/* ── Nombre ── */}
              <input type="hidden" name="paletteIdx" value={draftGradIdx} />
              <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#7FA8C4", fontWeight: 600, marginBottom: 9 }}>
                ¿Cómo se llama tu aventura?
              </div>
              <input
                name="title"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Ej. Recuperar el sueño"
                autoFocus
                style={{
                  width: "100%", fontFamily: "var(--font-hanken)", fontSize: 15,
                  color: "#ECE6D8", background: "rgba(236,230,216,.06)",
                  border: "1px solid rgba(236,230,216,.18)", borderRadius: 13,
                  padding: "13px 15px", outline: "none", marginBottom: 20,
                  boxSizing: "border-box",
                }}
              />
              {state.errors?.title && (
                <p style={{ color: "#C97B7B", fontSize: 13, margin: "-16px 0 16px" }}>{state.errors.title[0]}</p>
              )}

              {/* ── Selector de paisaje ── */}
              <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#7FA8C4", fontWeight: 600, marginBottom: 11 }}>
                Elige su paisaje
              </div>
              <div style={{ display: "flex", gap: 11, marginBottom: 22 }}>
                {PALETTES.map((grad, i) => (
                  <div
                    key={i}
                    onClick={() => setDraftGradIdx(i)}
                    style={{
                      flex: 1, height: 54, borderRadius: 12, cursor: "pointer",
                      background: grad,
                      border: i === draftGradIdx ? "2px solid #E3A878" : "2px solid transparent",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)",
                      transition: "border-color .18s ease",
                    }}
                  />
                ))}
              </div>

              {/* ── Misiones iniciales ── */}
              <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#7FA8C4", fontWeight: 600, marginBottom: 11 }}>
                Primeras misiones
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 14 }}>
                {draftMissions.map((m, i) => {
                  const lv = MISSION_LEVELS[Math.min(Math.max(m.diff - 1, 0), 2)];
                  return (
                    <div key={i} style={{
                      display: "flex", gap: 11, alignItems: "center",
                      background: "rgba(236,230,216,.05)", border: "1px solid rgba(236,230,216,.1)",
                      borderRadius: 12, padding: "11px 13px",
                    }}>
                      <input type="hidden" name="initialMission" value={m.name} />
                      <input type="hidden" name="initialMissionDiff" value={m.diff} />
                      <div style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", border: `2px solid ${lv.color}` }} />
                      <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: "#ECE6D8" }}>{m.name}</div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: `rgba(${hexToRgb(lv.color)},.12)`,
                        border: `1px solid rgba(${hexToRgb(lv.color)},.3)`,
                        borderRadius: 999, padding: "3px 8px", flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: lv.color }}>{lv.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDraftMissions((ms) => ms.filter((_, j) => j !== i))}
                        style={{ flexShrink: 0, background: "transparent", border: "none", color: "#8FA0A6", fontSize: 15, cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Difficulty chips for next mission */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {MISSION_LEVELS.map((lv) => {
                  const active = draftMissionLevel === lv.value;
                  return (
                    <div
                      key={lv.value}
                      onClick={() => setDraftMissionLevel(lv.value)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        cursor: "pointer",
                        background: active ? `rgba(${hexToRgb(lv.color)},.16)` : "rgba(236,230,216,.05)",
                        border: `1.5px solid ${active ? lv.color : "rgba(236,230,216,.15)"}`,
                        borderRadius: 999, padding: "6px 13px",
                        transition: "all .15s ease",
                      }}
                    >
                      <div style={{ display: "flex", gap: 3 }}>
                        {[1, 2, 3].map((d) => (
                          <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: d <= lv.value ? lv.color : "rgba(236,230,216,.18)" }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: active ? lv.color : "#8FA0A6" }}>{lv.label}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 26 }}>
                <input
                  value={missionInput}
                  onChange={(e) => setMissionInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMission(); } }}
                  placeholder="Añade una misión y pulsa +"
                  style={{
                    flex: 1, fontFamily: "var(--font-hanken)", fontSize: 14,
                    color: "#ECE6D8", background: "rgba(236,230,216,.06)",
                    border: "1px solid rgba(236,230,216,.18)", borderRadius: 12,
                    padding: "11px 14px", outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={addMission}
                  style={{
                    flexShrink: 0, width: 46, borderRadius: 12,
                    background: "rgba(91,155,209,.22)", border: "1px solid rgba(146,199,230,.4)",
                    color: "#CDE6F5", fontSize: 20, cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>

              {/* ── Acciones ── */}
              <div style={{ display: "flex", gap: 11 }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    flexShrink: 0, fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 15,
                    color: "#ECE6D8", background: "rgba(236,230,216,.08)",
                    border: "1px solid rgba(236,230,216,.18)", borderRadius: 999,
                    padding: "14px 22px", cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!canCreate || pending}
                  style={{
                    flex: 1, fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 15,
                    color: canCreate ? "#1E282A" : "rgba(30,40,42,.5)",
                    background: canCreate ? "#E3A878" : "rgba(227,168,120,.35)",
                    border: "none", borderRadius: 999, padding: "14px",
                    cursor: canCreate ? "pointer" : "not-allowed",
                    boxShadow: canCreate ? "0 10px 26px rgba(227,168,120,.25)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                    transition: "background .2s ease, color .2s ease",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2A332D", flexShrink: 0 }} />
                  {pending ? "Creando..." : "Crear aventura"}
                </button>
              </div>

            </form>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
