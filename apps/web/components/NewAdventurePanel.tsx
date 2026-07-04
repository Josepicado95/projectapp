"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { MISSION_LEVELS, hexToRgb } from "./MissionEditorModal";
import { PALETTES } from "@/lib/palettes";

type Props = { fullWidth?: boolean; onCreated: () => void };
type SaveState = { status: "idle" | "saving" | "error"; error?: string };

export default function NewAdventurePanel({ fullWidth, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftGradIdx, setDraftGradIdx] = useState(0);
  const [draftMissions, setDraftMissions] = useState<{ name: string; diff: number }[]>([]);
  const [missionInput, setMissionInput] = useState("");
  const [draftMissionLevel, setDraftMissionLevel] = useState(2);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveState({ status: "saving" });
    try {
      const res = await fetch("/api/mobile/adventures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle,
          paletteIdx: draftGradIdx,
          initialMissions: draftMissions.map((m) => ({ title: m.name, difficulty: m.diff })),
        }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveState({ status: "error", error: body?.error?.message ?? "No se pudo crear la aventura." });
        return;
      }
      setOpen(false);
      setDraftTitle("");
      setDraftGradIdx(0);
      setDraftMissions([]);
      setMissionInput("");
      setDraftMissionLevel(2);
      setSaveState({ status: "idle" });
      onCreated();
    } catch {
      setSaveState({ status: "error", error: "No se pudo crear la aventura." });
    }
  }

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

          {/* Centering wrapper */}
          <div style={{
            position: "fixed", inset: 0, zIndex: 201,
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            {/* Modal — flex-column with sticky top + scrollable middle + sticky bottom */}
            <form
              onSubmit={handleSubmit}
              style={{
                pointerEvents: "auto",
                width: 520, maxHeight: 660,
                display: "flex", flexDirection: "column", overflow: "hidden",
                background: "rgba(22,30,38,.88)",
                backdropFilter: "blur(26px) saturate(1.2)",
                WebkitBackdropFilter: "blur(26px) saturate(1.2)",
                border: "1px solid rgba(236,230,216,.18)",
                borderRadius: 26,
                boxShadow: "0 28px 70px rgba(0,0,0,.55), inset 0 1px 0 rgba(236,230,216,.12)",
                animation: "av-riseB .26s ease both",
                boxSizing: "border-box",
              }}
            >

              {/* ── TOP: header + preview + name + palette + missions label (non-scrolling) ── */}
              <div style={{ flexShrink: 0, padding: "22px 26px 0" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
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

                {/* Landscape preview */}
                <div style={{
                  margin: "12px 0 14px", height: 76, borderRadius: 14, overflow: "hidden",
                  position: "relative", background: PALETTES[draftGradIdx],
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)",
                }}>
                  <div style={{ position: "absolute", right: 18, top: 12, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.7)" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 28, background: "rgba(0,0,0,.18)", clipPath: "polygon(0 60%,30% 32%,60% 54%,100% 36%,100% 100%,0 100%)" }} />
                  <div style={{ position: "absolute", left: 16, bottom: 10, fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 17, color: "#FBF8F1", textShadow: "0 1px 6px rgba(0,0,0,.4)" }}>
                    {draftTitle.trim() || "Tu aventura"}
                  </div>
                </div>

                {/* Name */}
                <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#7FA8C4", fontWeight: 600, marginBottom: 7 }}>
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
                    padding: "11px 14px", outline: "none", marginBottom: 14,
                    boxSizing: "border-box",
                  }}
                />
                {saveState.status === "error" && (
                  <p style={{ color: "#C97B7B", fontSize: 13, margin: "-10px 0 12px" }}>{saveState.error}</p>
                )}

                {/* Palette picker */}
                <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#7FA8C4", fontWeight: 600, marginBottom: 8 }}>
                  Elige su paisaje
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  {PALETTES.map((grad, i) => (
                    <div
                      key={i}
                      onClick={() => setDraftGradIdx(i)}
                      style={{
                        flex: 1, height: 46, borderRadius: 11, cursor: "pointer",
                        background: grad,
                        border: i === draftGradIdx ? "2px solid #E3A878" : "2px solid transparent",
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)",
                        transition: "border-color .18s ease",
                      }}
                    />
                  ))}
                </div>

                {/* Missions section label */}
                <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#7FA8C4", fontWeight: 600, marginBottom: 8 }}>
                  Primeras misiones
                </div>
              </div>

              {/* ── MIDDLE: scrollable missions list ── */}
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", padding: "0 26px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 8 }}>
                  {draftMissions.map((m, i) => {
                    const lv = MISSION_LEVELS[Math.min(Math.max(m.diff - 1, 0), 2)];
                    return (
                      <div key={i} style={{
                        display: "flex", gap: 11, alignItems: "center",
                        background: "rgba(236,230,216,.05)", border: "1px solid rgba(236,230,216,.1)",
                        borderRadius: 12, padding: "10px 12px",
                      }}>
                        <div style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", border: `2px solid ${lv.color}` }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#ECE6D8" }}>{m.name}</div>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 6, marginTop: 4,
                            width: "fit-content",
                            background: `rgba(${hexToRgb(lv.color)},.12)`,
                            border: `1px solid rgba(${hexToRgb(lv.color)},.3)`,
                            borderRadius: 999, padding: "2px 8px",
                          }}>
                            <div style={{ display: "flex", gap: 3 }}>
                              {[1, 2, 3].map((d) => (
                                <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: d <= lv.value ? lv.color : "rgba(236,230,216,.18)" }} />
                              ))}
                            </div>
                            <span style={{ fontSize: 10.5, fontWeight: 600, color: lv.color }}>{lv.label}</span>
                          </div>
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
              </div>

              {/* ── BOTTOM: difficulty chips + input + actions (non-scrolling) ── */}
              <div style={{ flexShrink: 0, padding: "10px 26px 22px" }}>
                {/* Difficulty chips */}
                <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
                  {MISSION_LEVELS.map((lv) => {
                    const active = draftMissionLevel === lv.value;
                    return (
                      <div
                        key={lv.value}
                        onClick={() => setDraftMissionLevel(lv.value)}
                        style={{
                          flex: 1, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          background: active ? `rgba(${hexToRgb(lv.color)},.16)` : "rgba(236,230,216,.05)",
                          border: `1.5px solid ${active ? lv.color : "rgba(236,230,216,.15)"}`,
                          borderRadius: 10, padding: "7px 5px",
                          transition: "all .18s ease",
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

                {/* Mission input row */}
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <input
                    value={missionInput}
                    onChange={(e) => setMissionInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMission(); } }}
                    placeholder="Añade una misión y pulsa +"
                    style={{
                      flex: 1, fontFamily: "var(--font-hanken)", fontSize: 14,
                      color: "#ECE6D8", background: "rgba(236,230,216,.06)",
                      border: "1px solid rgba(236,230,216,.18)", borderRadius: 12,
                      padding: "10px 14px", outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={addMission}
                    style={{
                      flexShrink: 0, width: 44, borderRadius: 12,
                      background: "rgba(91,155,209,.22)", border: "1px solid rgba(146,199,230,.4)",
                      color: "#CDE6F5", fontSize: 20, cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 11 }}>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    style={{
                      flexShrink: 0, fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 15,
                      color: "#ECE6D8", background: "rgba(236,230,216,.08)",
                      border: "1px solid rgba(236,230,216,.18)", borderRadius: 14,
                      padding: "13px 22px", cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!canCreate || saveState.status === "saving"}
                    style={{
                      flex: 1, fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 15,
                      color: canCreate ? "#1E282A" : "rgba(30,40,42,.5)",
                      background: canCreate ? "#E3A878" : "rgba(227,168,120,.35)",
                      border: "none", borderRadius: 14, padding: "13px",
                      cursor: canCreate ? "pointer" : "not-allowed",
                      boxShadow: canCreate ? "0 10px 26px rgba(227,168,120,.25)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                      transition: "background .2s ease, color .2s ease",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2A332D", flexShrink: 0 }} />
                    {saveState.status === "saving" ? "Creando..." : "Crear aventura"}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
