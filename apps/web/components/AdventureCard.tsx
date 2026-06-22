"use client";

import { useState, useEffect, useRef, useActionState } from "react";
import { createPortal } from "react-dom";
import { Adventure, Mission } from "@/lib/generated/prisma/client";
import { updateAdventure, deleteAdventure } from "@/app/actions/adventures";
import { toggleMission, createMission } from "@/app/actions/missions";
import { CardTheme } from "@/lib/theme";

type AdventureWithMissions = Adventure & { missions: Mission[] };
type AdventureCardProps = { adventure: AdventureWithMissions; index: number; theme: CardTheme };

const GRADIENTS = [
  "linear-gradient(180deg,#2C3A52 0%,#5E5670 60%,#A88098 100%)",
  "linear-gradient(180deg,#F0C9A8 0%,#E3A878 55%,#C98A6A 100%)",
  "linear-gradient(180deg,#C9DCE3 0%,#AFC3B4 52%,#8BA893 78%,#6E8C78 100%)",
  "linear-gradient(180deg,#1B2330 0%,#2C3340 55%,#3A5A5E 100%)",
];

const ACCENT_COLORS = ["#F3E7D2", "#FBEFD9", "#F3ECDF", "#E3C9A0"];

function progressGradient(pct: number) {
  if (pct >= 75) return "linear-gradient(90deg,#7E9A86,#93B7CC)";
  if (pct >= 35) return "linear-gradient(90deg,#E3A878,#F0C9A8)";
  return "linear-gradient(90deg,#93B7CC,#C2DAE6)";
}


const INPUT_STYLE: React.CSSProperties = {
  border: "1px solid #D8D1C4",
  borderRadius: 10,
  padding: "9px 12px",
  fontSize: 14,
  color: "#2A332D",
  outline: "none",
  background: "rgba(251,248,241,.9)",
  width: "100%",
  boxSizing: "border-box",
};

export default function AdventureCard({ adventure, index, theme }: AdventureCardProps) {
  const glass: React.CSSProperties = {
    background: theme.glassBg,
    backdropFilter: "blur(18px) saturate(1.3)",
    WebkitBackdropFilter: "blur(18px) saturate(1.3)",
    border: `1px solid ${theme.glassBorder}`,
    borderRadius: 18,
    padding: "20px 22px",
    boxShadow: `0 4px 6px rgba(42,51,45,.04), 0 14px 36px ${theme.glassShadow}, inset 0 1px 0 ${theme.glassInner}`,
  };
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAddMission, setShowAddMission] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const kebabRef = useRef<HTMLButtonElement>(null);

  const [missionState, missionAction, missionPending] = useActionState(
    createMission,
    {}
  );

  useEffect(() => {
    if (missionState.message) setShowAddMission(false);
  }, [missionState.message]);

  const total = adventure.missions.length;
  const done = adventure.missions.filter((m) => m.completed).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const nextMission = adventure.missions.find((m) => !m.completed);

  const gi = index % GRADIENTS.length;

  if (editing) {
    return (
      <div style={glass}>
        {updateError && (
          <p style={{ color: "#C97B7B", fontSize: 13, marginBottom: 10 }}>{updateError}</p>
        )}
        <form
          action={async (formData) => {
            try {
              setUpdateError(null);
              await updateAdventure(formData);
              setEditing(false);
            } catch {
              setUpdateError("Error al guardar. Verifica los datos.");
            }
          }}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <input type="hidden" name="id" value={adventure.id} />
          <input name="title" defaultValue={adventure.title} required style={INPUT_STYLE} />
          <input
            name="description"
            defaultValue={adventure.description ?? ""}
            placeholder="Descripción (opcional)"
            style={INPUT_STYLE}
          />
          <select name="status" defaultValue={adventure.status} style={INPUT_STYLE}>
            <option value="active">Activa</option>
            <option value="paused">Pausada</option>
            <option value="completed">Completada</option>
          </select>
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            <button type="submit" style={{ background: "#2A332D", color: "#FBF8F1", border: "none", borderRadius: 999, padding: "9px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Guardar
            </button>
            <button type="button" onClick={() => setEditing(false)} style={{ background: "transparent", color: "#5C665E", border: "1px solid #D8D1C4", borderRadius: 999, padding: "9px 18px", fontSize: 14, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={glass}>

      {/* ── Fila principal ── */}
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>

        {/* Miniatura paisaje */}
        <div style={{
          flexShrink: 0, width: 78, height: 78, borderRadius: 14,
          background: GRADIENTS[gi], position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", right: 10, top: 10,
            width: 17, height: 17, borderRadius: "50%",
            background: ACCENT_COLORS[gi],
          }} />
          <svg viewBox="0 0 78 78" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <path d="M8 70 C 26 58, 24 42, 46 32 S 68 14, 72 7" fill="none" stroke="rgba(251,248,241,.5)" strokeWidth="2.5" strokeDasharray="2 6" strokeLinecap="round" />
          </svg>
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: 26,
            background: "rgba(0,0,0,.22)",
            clipPath: "polygon(0 70%,30% 45%,60% 65%,100% 50%,100% 100%,0 100%)",
          }} />
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 18, color: theme.cardInk, lineHeight: 1.25 }}>
              {adventure.title}
            </div>
            {total > 0 && (
              <div style={{ fontSize: 12, color: theme.cardSub, marginTop: 2 }}>{done} de {total}</div>
            )}
          </div>

          {nextMission ? (
            <div style={{ fontSize: 13, color: theme.cardSub, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Siguiente: {nextMission.title}
            </div>
          ) : adventure.description ? (
            <div style={{ fontSize: 13, color: theme.cardSub, marginBottom: 10 }}>
              {adventure.description}
            </div>
          ) : <div style={{ marginBottom: 10 }} />}

          {total > 0 && (
            <div style={{ height: 7, borderRadius: 999, background: theme.trackBg, overflow: "hidden" }}>
              <div style={{
                height: 7, width: `${progress}%`, borderRadius: 999,
                background: progressGradient(progress),
                transition: "width .4s ease",
              }} />
            </div>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>

          {/* Kebab menu ⋮ */}
          <button
            ref={kebabRef}
            onClick={() => {
              if (showMenu) {
                setShowMenu(false);
                setMenuPos(null);
              } else {
                const rect = kebabRef.current!.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, left: rect.right - 130 });
                setShowMenu(true);
              }
            }}
            title="Más opciones"
            style={{
              background: "none", border: "none",
              width: 30, height: 30, borderRadius: "50%",
              color: theme.cardSub, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, letterSpacing: 1,
            }}
          >
            ⋮
          </button>

          {/* Portal: se monta en document.body, escapa del backdrop-filter del card */}
          {showMenu && menuPos && createPortal(
            <>
              <div onClick={() => { setShowMenu(false); setMenuPos(null); }} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
              <div style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                background: "rgba(251,248,241,.97)",
                border: "1px solid rgba(255,255,255,.7)",
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(42,51,45,.15)",
                overflow: "hidden",
                zIndex: 100,
                minWidth: 130,
              }}>
                <button
                  onClick={() => { setEditing(true); setShowMenu(false); setMenuPos(null); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "11px 16px", background: "none", border: "none",
                    fontSize: 13, color: "#2A332D", cursor: "pointer",
                  }}
                >
                  Editar
                </button>
                <div style={{ height: 1, background: "rgba(42,51,45,.07)", margin: "0 10px" }} />
                <form action={deleteAdventure}>
                  <input type="hidden" name="id" value={adventure.id} />
                  <button
                    type="submit"
                    onClick={() => { setShowMenu(false); setMenuPos(null); }}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "11px 16px", background: "none", border: "none",
                      fontSize: 13, color: "#C97B7B", cursor: "pointer",
                    }}
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </>,
            document.body
          )}

          {/* Chevron expandir/colapsar */}
          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Colapsar" : "Ver misiones"}
            style={{
              background: "none", border: "none",
              width: 30, height: 30, borderRadius: "50%",
              color: expanded ? "#7E9A86" : "#B9C2B6",
              cursor: "pointer", padding: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform .25s ease, color .2s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

        </div>
      </div>

      {/* ── Misiones expandibles ── */}
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.trackBg}` }}>

          {/* Lista de misiones */}
          {adventure.missions.length === 0 ? (
            <p style={{ fontSize: 13, color: theme.cardSub, margin: "0 0 12px" }}>
              Sin misiones todavía.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 12 }}>
              {[...adventure.missions]
                .sort((a, b) => {
                  if (a.completed !== b.completed) return a.completed ? -1 : 1;
                  return a.id - b.id;
                })
                .map((m) => (
                <form key={m.id} action={toggleMission} style={{
                  display: "flex", gap: 12, alignItems: "center",
                  padding: "9px 4px",
                  borderBottom: `1px solid ${theme.trackBg}`,
                }}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="adventureId" value={adventure.id} />
                  <button type="submit" style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
                    border: m.completed ? "none" : "2px solid #7E9A86",
                    background: m.completed ? "#7E9A86" : "transparent",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {m.completed && <span style={{ color: "#FBF8F1", fontSize: 11, lineHeight: 1 }}>✓</span>}
                  </button>
                  <span style={{
                    flex: 1, fontSize: 14,
                    color: m.completed ? theme.cardSub : theme.cardInk,
                    textDecoration: m.completed ? "line-through" : "none",
                  }}>
                    {m.title}
                  </span>
                  <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                    {[1, 2, 3].map((d) => (
                      <div key={d} style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: d <= m.difficulty ? "#E3A878" : theme.trackBg,
                      }} />
                    ))}
                  </div>
                </form>
              ))}
            </div>
          )}

          {/* Form nueva misión */}
          {showAddMission ? (
            <form action={missionAction} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="hidden" name="adventureId" value={adventure.id} />
              <input
                name="title"
                placeholder="Nombre de la misión"
                required
                autoFocus
                style={{ ...INPUT_STYLE, fontSize: 13, padding: "8px 10px" }}
              />
              {missionState.errors?.title && (
                <p style={{ fontSize: 11, color: "#C97B7B", margin: 0 }}>{missionState.errors.title[0]}</p>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  name="difficulty"
                  defaultValue="1"
                  style={{ ...INPUT_STYLE, width: "auto", fontSize: 13, padding: "8px 10px" }}
                >
                  <option value="1">● Fácil</option>
                  <option value="2">●● Media</option>
                  <option value="3">●●● Difícil</option>
                </select>
                <button
                  type="submit"
                  disabled={missionPending}
                  style={{
                    background: "#2A332D", color: "#FBF8F1", border: "none",
                    borderRadius: 999, padding: "8px 16px", fontSize: 13,
                    fontWeight: 600, cursor: missionPending ? "not-allowed" : "pointer",
                    opacity: missionPending ? 0.6 : 1,
                  }}
                >
                  {missionPending ? "..." : "Agregar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMission(false)}
                  style={{ background: "none", border: "none", fontSize: 13, color: "#8A8D85", cursor: "pointer" }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddMission(true)}
              style={{
                background: "none", border: "1px dashed #C9C2B4",
                borderRadius: 10, padding: "7px 14px",
                fontSize: 13, color: "#8A8D85", cursor: "pointer",
                width: "100%", textAlign: "left",
              }}
            >
              + Agregar misión
            </button>
          )}
        </div>
      )}
    </div>
  );
}
