"use client";

import { useState, useRef, useActionState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import NewAdventurePanel from "./NewAdventurePanel";
import { MomentTheme } from "@/lib/theme";
import { toggleMission, createMission } from "@/app/actions/missions";
import { updateAdventure, deleteAdventure } from "@/app/actions/adventures";
import type { Adventure, Mission, CheckIn } from "@/lib/generated/prisma/client";

type AdventureWithMissions = Adventure & { missions: Mission[] };
type Rec = { id: number; title: string; reason: string };
type RecsResult = { recommendations: Rec[]; message: string } | null;

const GRADIENTS = [
  "linear-gradient(180deg,#2C3A52 0%,#5E5670 60%,#A88098 100%)",
  "linear-gradient(180deg,#F0C9A8 0%,#E3A878 55%,#C98A6A 100%)",
  "linear-gradient(180deg,#C9DCE3 0%,#AFC3B4 52%,#8BA893 78%,#6E8C78 100%)",
  "linear-gradient(180deg,#1B2330 0%,#2C3340 55%,#3A5A5E 100%)",
];

const INPUT_STYLE: React.CSSProperties = {
  border: "1px solid rgba(236,230,216,.3)",
  borderRadius: 10,
  padding: "9px 12px",
  fontSize: 13,
  color: "#2A332D",
  outline: "none",
  background: "rgba(251,248,241,.9)",
  width: "100%",
  boxSizing: "border-box",
};

type Props = {
  adventures: AdventureWithMissions[];
  todayCheckIn: CheckIn | null;
  recommendations: RecsResult;
  theme: MomentTheme;
};

export default function DashboardBody({ adventures, todayCheckIn, recommendations, theme }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [fadeTick, setFadeTick] = useState(0);
  const [showAddMission, setShowAddMission] = useState(false);
  const [showKebab, setShowKebab] = useState(false);
  const [kebabPos, setKebabPos] = useState<{ top: number; right: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const kebabRef = useRef<HTMLButtonElement>(null);

  const activeAdventures = adventures.filter((a) => a.status !== "completed");
  const selected = activeAdventures.find((a) => a.id === selectedId) ?? null;

  const [missionState, missionAction, missionPending] = useActionState(createMission, {});

  useEffect(() => {
    if (missionState.message) setShowAddMission(false);
  }, [missionState.message]);

  // Reset panel state when switching adventures
  function selectAdventure(id: number) {
    if (id === selectedId) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
      setShowAddMission(false);
      setEditing(false);
    }
    setFadeTick((t) => t + 1);
  }

  function goBack() {
    setSelectedId(null);
    setEditing(false);
    setFadeTick((t) => t + 1);
  }

  const panelAnim = fadeTick % 2 === 0 ? "av-riseA .22s ease both" : "av-riseB .22s ease both";

  const glassBorder = `1px solid ${theme.glassBorder}`;

  return (
    <div style={{
      flex: 1, display: "flex", gap: 20, overflow: "hidden",
      padding: "0 34px 28px",
    }}>

      {/* ── Columna izquierda: mini-tarjetas ── */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        {activeAdventures.length === 0 ? (
          <div style={{
            background: theme.glassBg,
            backdropFilter: "blur(18px) saturate(1.3)",
            WebkitBackdropFilter: "blur(18px) saturate(1.3)",
            border: glassBorder, borderRadius: 18, padding: "22px 20px",
            color: theme.cardSub, fontSize: 14, lineHeight: 1.6,
          }}>
            Todavía no tienes aventuras activas.{" "}
            <span style={{ color: theme.cardInk, fontWeight: 500 }}>Crea la primera con el panel de la derecha.</span>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ gap: 13, alignContent: "start" }}
          >
            {activeAdventures.map((adventure, i) => {
              const done = adventure.missions.filter((m) => m.completed).length;
              const total = adventure.missions.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const isSel = adventure.id === selectedId;

              return (
                <div
                  key={adventure.id}
                  onClick={() => selectAdventure(adventure.id)}
                  style={{
                    background: isSel ? "rgba(91,155,209,.18)" : theme.glassBg,
                    backdropFilter: "blur(18px) saturate(1.15)",
                    WebkitBackdropFilter: "blur(18px) saturate(1.15)",
                    border: `1px solid ${isSel ? "rgba(146,199,230,.55)" : theme.glassBorder}`,
                    borderRadius: 16, padding: 14,
                    display: "flex", gap: 13, alignItems: "center",
                    cursor: "pointer",
                    boxShadow: `inset 0 1px 0 ${theme.glassInner}`,
                    transition: "background .22s ease, border-color .22s ease",
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    flexShrink: 0, width: 46, height: 46, borderRadius: 12,
                    background: GRADIENTS[i % GRADIENTS.length],
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.18)",
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", left: 9, top: 9,
                      width: 12, height: 12, borderRadius: "50%",
                      background: "rgba(255,255,255,.6)",
                    }} />
                  </div>

                  {/* Texto */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "var(--font-schibsted)", fontWeight: 600,
                      fontSize: 15, color: theme.cardInk, lineHeight: 1.15,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {adventure.title}
                    </div>
                    <div style={{ fontSize: 12, color: theme.cardSub, marginTop: 2 }}>
                      {done} de {total}
                    </div>
                    <div style={{ marginTop: 8, height: 5, borderRadius: 999, background: theme.trackBg }}>
                      <div style={{
                        height: 5, borderRadius: 999, width: `${pct}%`,
                        background: "linear-gradient(90deg,#7E9A86,#5B9BD1)",
                        transition: "width .3s ease",
                      }} />
                    </div>
                  </div>

                  {/* Chevron */}
                  <div style={{
                    flexShrink: 0, fontSize: 20, lineHeight: 1,
                    color: isSel ? "#92C7E6" : theme.cardSub,
                    transition: "color .2s ease",
                  }}>›</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Rail derecho: panel contextual ── */}
      <div style={{
        flexShrink: 0, width: 352,
        background: theme.glassBg,
        backdropFilter: "blur(20px) saturate(1.15)",
        WebkitBackdropFilter: "blur(20px) saturate(1.15)",
        border: glassBorder,
        borderRadius: 24,
        boxShadow: `0 18px 48px ${theme.glassShadow}, inset 0 1px 0 ${theme.glassInner}`,
        overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <div
          key={fadeTick}
          style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", overflow: "hidden", animation: panelAnim }}
        >

          {/* ═══════════════════════════
              ESTADO: HOY (sin selección)
          ═══════════════════════════ */}
          {!selected && (
            <>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 20, color: theme.cardInk }}>
                  Hoy
                </div>
                {todayCheckIn && (
                  <Link href="/checkin" style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: theme.trackBg, border: glassBorder,
                    padding: "5px 10px", borderRadius: 999, textDecoration: "none",
                  }}>
                    <span style={{ fontSize: 12, color: theme.cardSub }}>Energía</span>
                    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 15 }}>
                      {([todayCheckIn.energy, todayCheckIn.mood, todayCheckIn.sleep, 10 - todayCheckIn.stress] as number[]).map((val, i) => (
                        <div key={i} style={{
                          width: 4, borderRadius: 2,
                          height: Math.max(3, Math.round((val / 10) * 15)),
                          background: i === 0 || i === 1 ? "#7E9A86" : i === 2 ? "#E3A878" : theme.cardSub,
                        }} />
                      ))}
                    </div>
                  </Link>
                )}
              </div>

              {/* Contenido central */}
              <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
                {!todayCheckIn && (
                  <>
                    <div style={{ fontSize: 13.5, color: theme.cardSub, fontStyle: "italic", marginBottom: 16, lineHeight: 1.6 }}>
                      Registra cómo llegás hoy para ver qué misiones se adaptan mejor a tu momento.
                    </div>
                    <Link href="/checkin" style={{
                      display: "block", textAlign: "center",
                      fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 14,
                      color: "#FBF8F1", background: "#2A332D",
                      borderRadius: 999, padding: "12px",
                      textDecoration: "none",
                    }}>
                      Hacer check-in →
                    </Link>
                  </>
                )}

                {todayCheckIn && recommendations && recommendations.recommendations.length > 0 && (
                  <>
                    <div style={{ fontSize: 13.5, color: theme.cardSub, fontStyle: "italic", marginBottom: 14, lineHeight: 1.5 }}>
                      {recommendations.message}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: theme.cardSub, marginBottom: 12 }}>
                      Recomendado para hoy
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {recommendations.recommendations.slice(0, 3).map((rec) => (
                        <div key={rec.id} style={{
                          display: "flex", gap: 11, alignItems: "flex-start",
                          background: theme.trackBg, border: glassBorder,
                          borderRadius: 13, padding: "13px 14px",
                        }}>
                          <span style={{ color: "#E3A878", marginTop: 1, flexShrink: 0 }}>✦</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14.5, color: theme.cardInk }}>{rec.title}</div>
                            <div style={{ fontSize: 12, color: theme.cardSub, marginTop: 2 }}>{rec.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {todayCheckIn && !recommendations && (
                  <div style={{ fontSize: 13, color: theme.cardSub, lineHeight: 1.5 }}>
                    Check-in registrado ✓ — Las recomendaciones no están disponibles en este momento.
                  </div>
                )}
              </div>

              {/* Acciones pinned */}
              <div style={{ flexShrink: 0, paddingTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                <NewAdventurePanel fullWidth />
                <Link href="/progress" style={{
                  display: "block", textAlign: "center",
                  fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 15,
                  color: theme.cardInk,
                  background: theme.trackBg, border: glassBorder,
                  borderRadius: 999, padding: "14px",
                  textDecoration: "none",
                }}>
                  Mi progreso
                </Link>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════
              ESTADO: MISIONES (aventura selec.)
          ═══════════════════════════════════ */}
          {selected && (
            <>
              {/* Back + kebab */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexShrink: 0 }}>
                <button
                  onClick={goBack}
                  style={{
                    fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 13,
                    color: theme.cardSub, background: theme.trackBg, border: glassBorder,
                    borderRadius: 999, padding: "7px 14px", cursor: "pointer",
                  }}
                >
                  ‹ Hoy
                </button>
                <button
                  ref={kebabRef}
                  onClick={() => {
                    if (showKebab) {
                      setShowKebab(false);
                    } else {
                      const rect = kebabRef.current!.getBoundingClientRect();
                      setKebabPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                      setShowKebab(true);
                    }
                  }}
                  style={{
                    background: "none", border: "none",
                    width: 30, height: 30, borderRadius: "50%",
                    color: theme.cardSub, cursor: "pointer",
                    fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  ⋮
                </button>
              </div>

              {/* Título + badge */}
              {!editing ? (
                <>
                  <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: theme.cardSub, fontWeight: 600, flexShrink: 0 }}>
                    Aventura
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4, marginBottom: 16, flexShrink: 0 }}>
                    <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 21, color: theme.cardInk, lineHeight: 1.2, maxWidth: 220 }}>
                      {selected.title}
                    </div>
                    <div style={{
                      flexShrink: 0, fontSize: 12.5, color: theme.cardSub,
                      background: theme.trackBg, border: glassBorder,
                      padding: "5px 11px", borderRadius: 999, marginLeft: 8, marginTop: 2, whiteSpace: "nowrap",
                    }}>
                      {selected.missions.filter((m) => m.completed).length} de {selected.missions.length} misiones
                    </div>
                  </div>
                  {/* Barra de progreso */}
                  {selected.missions.length > 0 && (
                    <div style={{ marginBottom: 20, flexShrink: 0, height: 8, borderRadius: 999, background: theme.trackBg }}>
                      <div style={{
                        height: 8, borderRadius: 999, transition: "width .3s ease",
                        width: `${Math.round((selected.missions.filter((m) => m.completed).length / selected.missions.length) * 100)}%`,
                        background: "linear-gradient(90deg,#7E9A86,#5B9BD1)",
                      }} />
                    </div>
                  )}
                </>
              ) : (
                /* Modo edición inline */
                <form
                  action={async (fd) => { await updateAdventure(fd); setEditing(false); }}
                  style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16, flexShrink: 0 }}
                >
                  <input type="hidden" name="id" value={selected.id} />
                  <input name="title" defaultValue={selected.title} required style={INPUT_STYLE} />
                  <input name="description" defaultValue={selected.description ?? ""} placeholder="Descripción" style={INPUT_STYLE} />
                  <select name="status" defaultValue={selected.status} style={INPUT_STYLE}>
                    <option value="active">Activa</option>
                    <option value="paused">Pausada</option>
                    <option value="completed">Completada</option>
                  </select>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" style={{ background: "#2A332D", color: "#FBF8F1", border: "none", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Guardar
                    </button>
                    <button type="button" onClick={() => setEditing(false)} style={{ background: "none", color: theme.cardSub, border: glassBorder, borderRadius: 999, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de misiones */}
              <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {selected.missions.map((m) => (
                    <form key={m.id} action={toggleMission}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="adventureId" value={selected.id} />
                      <button type="submit" style={{
                        width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer",
                      }}>
                        <div style={{
                          display: "flex", gap: 13, alignItems: "center",
                          background: m.completed ? "rgba(126,154,134,.1)" : theme.trackBg,
                          border: glassBorder,
                          borderRadius: 13, padding: "13px 15px",
                          transition: "background .2s ease",
                        }}>
                          <div style={{
                            flexShrink: 0, width: 23, height: 23, borderRadius: "50%",
                            border: m.completed ? "2px solid #7E9A86" : "2px solid #5B9BD1",
                            background: m.completed ? "#7E9A86" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#FBF8F1", fontSize: 13, transition: "all .2s ease",
                          }}>
                            {m.completed ? "✓" : ""}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontWeight: 600, fontSize: 14.5,
                              color: m.completed ? theme.cardSub : theme.cardInk,
                              textDecoration: m.completed ? "line-through" : "none",
                            }}>
                              {m.title}
                            </div>
                            <div style={{ fontSize: 12, color: theme.cardSub, marginTop: 2 }}>
                              {m.difficulty === 1 ? "● Fácil" : m.difficulty === 2 ? "●● Media" : "●●● Difícil"}
                            </div>
                          </div>
                        </div>
                      </button>
                    </form>
                  ))}

                  {/* Agregar misión */}
                  {showAddMission ? (
                    <form action={missionAction} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input type="hidden" name="adventureId" value={selected.id} />
                      <input
                        name="title"
                        placeholder="Nombre de la misión"
                        required
                        autoFocus
                        style={{ ...INPUT_STYLE }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <select name="difficulty" defaultValue="1" style={{ ...INPUT_STYLE, width: "auto", padding: "8px 10px" }}>
                          <option value="1">● Fácil</option>
                          <option value="2">●● Media</option>
                          <option value="3">●●● Difícil</option>
                        </select>
                        <button type="submit" disabled={missionPending} style={{
                          background: "#2A332D", color: "#FBF8F1", border: "none",
                          borderRadius: 999, padding: "8px 14px", fontSize: 13,
                          fontWeight: 600, cursor: "pointer", flexShrink: 0,
                        }}>
                          {missionPending ? "..." : "Agregar"}
                        </button>
                      </div>
                      <button type="button" onClick={() => setShowAddMission(false)} style={{
                        background: "none", border: "none", fontSize: 12, color: theme.cardSub, cursor: "pointer", textAlign: "left",
                      }}>
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <div
                      onClick={() => setShowAddMission(true)}
                      style={{
                        display: "flex", gap: 13, alignItems: "center",
                        background: "rgba(236,230,216,.03)",
                        border: `1px dashed ${theme.glassBorder}`,
                        borderRadius: 13, padding: "13px 15px",
                        color: theme.cardSub, cursor: "pointer",
                      }}
                    >
                      <div style={{
                        flexShrink: 0, width: 23, height: 23, borderRadius: "50%",
                        border: `2px dashed ${theme.cardSub}`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                      }}>
                        +
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14.5 }}>Agregar misión</div>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA pinned */}
              <div style={{ flexShrink: 0, paddingTop: 18 }}>
                <form action={toggleMission}>
                  <input type="hidden" name="id" value={selected.missions.find((m) => !m.completed)?.id ?? ""} />
                  <input type="hidden" name="adventureId" value={selected.id} />
                  <button
                    type="submit"
                    disabled={!selected.missions.find((m) => !m.completed)}
                    style={{
                      width: "100%",
                      fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 15,
                      color: "#1E282A", background: "#E3A878",
                      border: "none", borderRadius: 999, padding: "14px",
                      cursor: "pointer", boxShadow: "0 10px 26px rgba(227,168,120,.25)",
                      opacity: selected.missions.find((m) => !m.completed) ? 1 : 0.4,
                    }}
                  >
                    Completar misión de hoy
                  </button>
                </form>
              </div>

              {/* Portal: menú kebab de aventura */}
              {showKebab && kebabPos && createPortal(
                <>
                  <div onClick={() => setShowKebab(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                  <div style={{
                    position: "fixed",
                    top: kebabPos.top,
                    right: kebabPos.right,
                    background: "rgba(251,248,241,.97)",
                    border: "1px solid rgba(255,255,255,.7)",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(42,51,45,.15)",
                    overflow: "hidden",
                    zIndex: 100, minWidth: 130,
                  }}>
                    <button
                      onClick={() => { setEditing(true); setShowKebab(false); }}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px", background: "none", border: "none", fontSize: 13, color: "#2A332D", cursor: "pointer" }}
                    >
                      Editar
                    </button>
                    <div style={{ height: 1, background: "rgba(42,51,45,.07)", margin: "0 10px" }} />
                    <form action={deleteAdventure} onSubmit={() => { setShowKebab(false); setSelectedId(null); }}>
                      <input type="hidden" name="id" value={selected.id} />
                      <button type="submit" style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px", background: "none", border: "none", fontSize: 13, color: "#C97B7B", cursor: "pointer" }}>
                        Eliminar
                      </button>
                    </form>
                  </div>
                </>,
                document.body
              )}
            </>
          )}

        </div>
      </div>

    </div>
  );
}
