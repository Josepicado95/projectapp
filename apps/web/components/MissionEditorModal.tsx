"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { saveMission, deleteMission } from "@/app/actions/missions";
import type { Mission } from "@/lib/generated/prisma/client";

export const MISSION_LEVELS = [
  { value: 1, label: "Suave", color: "#7E9A86", xp: 10 },
  { value: 2, label: "Media", color: "#5B9BD1", xp: 15 },
  { value: 3, label: "Reto",  color: "#E3A878", xp: 25 },
] as const;

export function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const DIM = "rgba(236,230,216,.18)";

type Props = {
  adventureId: number;
  mission?: Mission | null;
  onClose: () => void;
};

export default function MissionEditorModal({ adventureId, mission, onClose }: Props) {
  const isNew = !mission;
  const [name, setName] = useState(mission?.title ?? "");
  const [difficulty, setDifficulty] = useState<number>(mission?.difficulty ?? 2);

  const [state, formAction, pending] = useActionState(saveMission, {});
  const [deletePending, startDelete] = useTransition();

  useEffect(() => {
    if (state.message === "ok") onClose();
  }, [state.message]);

  function handleDelete() {
    if (!mission) return;
    const fd = new FormData();
    fd.set("id", String(mission.id));
    fd.set("adventureId", String(adventureId));
    startDelete(async () => {
      await deleteMission(fd);
      onClose();
    });
  }

  const canSave = name.trim().length > 0;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(8,12,22,.55)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          animation: "av-riseA .2s ease both",
        }}
      />

      {/* Centering wrapper */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 301,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
      }}>
        <form
          action={formAction}
          style={{
            pointerEvents: "auto",
            width: 470,
            background: "rgba(22,30,38,.88)",
            backdropFilter: "blur(26px) saturate(1.2)",
            WebkitBackdropFilter: "blur(26px) saturate(1.2)",
            border: "1px solid rgba(236,230,216,.18)",
            borderRadius: 24,
            boxShadow: "0 28px 70px rgba(0,0,0,.55), inset 0 1px 0 rgba(236,230,216,.12)",
            padding: "26px 28px",
            animation: "av-riseB .26s ease both",
            boxSizing: "border-box",
          }}
        >
          {/* Hidden fields */}
          {mission && <input type="hidden" name="id" value={mission.id} />}
          <input type="hidden" name="adventureId" value={adventureId} />
          <input type="hidden" name="difficulty" value={difficulty} />

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "#7FA8C4", fontWeight: 600 }}>
                {isNew ? "Nueva misión" : "Editar misión"}
              </div>
              <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 22, color: "#F2EFE6", marginTop: 4 }}>
                {isNew ? "Añadir una misión" : "Ajusta tu misión"}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
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

          {/* Nombre */}
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#7FA8C4", fontWeight: 600, marginBottom: 9 }}>
            Misión
          </div>
          <input
            name="title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Terminar curso de React"
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

          {/* Selector de dificultad */}
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#7FA8C4", fontWeight: 600, marginBottom: 11 }}>
            Nivel de dificultad
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            {MISSION_LEVELS.map((lv) => {
              const active = difficulty === lv.value;
              return (
                <div
                  key={lv.value}
                  onClick={() => setDifficulty(lv.value)}
                  style={{
                    flex: 1, cursor: "pointer", textAlign: "center",
                    background: active ? `rgba(${hexToRgb(lv.color)},.16)` : "rgba(236,230,216,.05)",
                    border: `2px solid ${active ? lv.color : "transparent"}`,
                    borderRadius: 14, padding: "13px 10px",
                    transition: "all .18s ease",
                  }}
                >
                  <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 7 }}>
                    {[1, 2, 3].map((d) => (
                      <span key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: d <= lv.value ? lv.color : DIM }} />
                    ))}
                  </div>
                  <div style={{ fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 14, color: active ? "#F2EFE6" : "#C7CFC9" }}>
                    {lv.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#8FA0A6", marginTop: 2 }}>+{lv.xp} XP</div>
                </div>
              );
            })}
          </div>

          {/* Acciones */}
          <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
            {!isNew && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletePending}
                style={{
                  flexShrink: 0, fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 14,
                  color: "#D89C92", background: "rgba(216,156,146,.1)",
                  border: "1px solid rgba(216,156,146,.3)", borderRadius: 999,
                  padding: "13px 18px", cursor: deletePending ? "not-allowed" : "pointer",
                  opacity: deletePending ? 0.6 : 1,
                }}
              >
                {deletePending ? "..." : "Eliminar"}
              </button>
            )}
            <button
              type="submit"
              disabled={!canSave || pending}
              style={{
                flex: 1, fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 15,
                color: canSave ? "#1E282A" : "rgba(30,40,42,.6)",
                background: canSave ? "#E3A878" : "rgba(227,168,120,.4)",
                border: "none", borderRadius: 999, padding: "14px",
                cursor: canSave ? "pointer" : "not-allowed",
                boxShadow: canSave ? "0 10px 26px rgba(227,168,120,.22)" : "none",
                transition: "background .2s ease",
              }}
            >
              {pending ? "..." : isNew ? "Añadir misión" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}
