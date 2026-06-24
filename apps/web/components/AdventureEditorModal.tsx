"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { updateAdventure, deleteAdventure } from "@/app/actions/adventures";
import { PALETTES } from "@/lib/palettes";
import type { Adventure, Mission } from "@/lib/generated/prisma/client";

type AdventureWithMissions = Adventure & { missions: Mission[] };

type Props = {
  adventure: AdventureWithMissions;
  onClose: () => void;
  onDeleted: () => void;
};

export default function AdventureEditorModal({ adventure, onClose, onDeleted }: Props) {
  const [title, setTitle] = useState(adventure.title);
  const [description, setDescription] = useState(adventure.description ?? "");
  const [paletteIdx, setPaletteIdx] = useState(adventure.paletteIdx ?? 0);
  const [savePending, startSave] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const canSave = title.trim().length >= 3;

  function handleSave() {
    if (!canSave) return;
    const fd = new FormData();
    fd.set("id", String(adventure.id));
    fd.set("title", title.trim());
    fd.set("description", description);
    fd.set("status", adventure.status ?? "active");
    fd.set("paletteIdx", String(paletteIdx));
    startSave(async () => {
      await updateAdventure(fd);
      onClose();
    });
  }

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(adventure.id));
    startDelete(async () => {
      await deleteAdventure(fd);
      onDeleted();
    });
  }

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
        <div
          style={{
            pointerEvents: "auto",
            width: 480,
            background: "rgba(22,30,38,.88)",
            backdropFilter: "blur(26px) saturate(1.2)",
            WebkitBackdropFilter: "blur(26px) saturate(1.2)",
            border: "1px solid rgba(236,230,216,.18)",
            borderRadius: 24,
            boxShadow: "0 28px 70px rgba(0,0,0,.55), inset 0 1px 0 rgba(236,230,216,.12)",
            padding: "26px 28px",
            animation: "av-riseB .26s ease both",
            boxSizing: "border-box" as const,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase" as const, color: "#7FA8C4", fontWeight: 600 }}>
                Tu aventura
              </div>
              <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 22, color: "#F2EFE6", marginTop: 4 }}>
                Editar aventura
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                flexShrink: 0, width: 34, height: 34, borderRadius: "50%",
                background: "rgba(236,230,216,.08)", border: "1px solid rgba(236,230,216,.16)",
                color: "#ECE6D8", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background .18s ease",
              }}
            >
              ✕
            </button>
          </div>

          {/* Landscape preview */}
          <div style={{
            marginBottom: 16, height: 64, borderRadius: 13, overflow: "hidden",
            position: "relative", background: PALETTES[paletteIdx],
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)",
          }}>
            <div style={{ position: "absolute", right: 14, top: 10, width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,.7)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 24, background: "rgba(0,0,0,.18)", clipPath: "polygon(0 60%,30% 32%,60% 54%,100% 36%,100% 100%,0 100%)" }} />
            <div style={{ position: "absolute", left: 14, bottom: 8, fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 15, color: "#FBF8F1", textShadow: "0 1px 6px rgba(0,0,0,.4)" }}>
              {title.trim() || "Tu aventura"}
            </div>
          </div>

          {/* Palette picker */}
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase" as const, color: "#7FA8C4", fontWeight: 600, marginBottom: 8 }}>
            Paisaje
          </div>
          <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
            {PALETTES.map((grad, i) => (
              <div
                key={i}
                onClick={() => setPaletteIdx(i)}
                style={{
                  flex: 1, height: 40, borderRadius: 10, cursor: "pointer",
                  background: grad,
                  border: i === paletteIdx ? "2px solid #E3A878" : "2px solid transparent",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)",
                  transition: "border-color .18s ease",
                }}
              />
            ))}
          </div>

          {/* Nombre */}
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase" as const, color: "#7FA8C4", fontWeight: 600, marginBottom: 8 }}>
            Nombre
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre de la aventura"
            autoFocus
            style={{
              width: "100%", fontFamily: "var(--font-hanken)", fontSize: 15,
              color: "#ECE6D8", background: "rgba(236,230,216,.06)",
              border: "1px solid rgba(236,230,216,.18)", borderRadius: 13,
              padding: "12px 14px", outline: "none", marginBottom: 14,
              boxSizing: "border-box" as const,
            }}
          />

          {/* Descripción (opcional) */}
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase" as const, color: "#7FA8C4", fontWeight: 600, marginBottom: 8 }}>
            Descripción <span style={{ opacity: .5, fontWeight: 400, textTransform: "none" as const }}>— opcional</span>
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿De qué va esta aventura?"
            style={{
              width: "100%", fontFamily: "var(--font-hanken)", fontSize: 15,
              color: "#ECE6D8", background: "rgba(236,230,216,.06)",
              border: "1px solid rgba(236,230,216,.18)", borderRadius: 13,
              padding: "12px 14px", outline: "none", marginBottom: 22,
              boxSizing: "border-box" as const,
            }}
          />

          {/* Acciones */}
          <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
            <button
              onClick={handleDelete}
              disabled={deletePending}
              style={{
                flexShrink: 0, fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 14,
                color: "#D89C92", background: "rgba(216,156,146,.1)",
                border: "1px solid rgba(216,156,146,.3)", borderRadius: 14,
                padding: "13px 18px", cursor: deletePending ? "not-allowed" : "pointer",
                opacity: deletePending ? 0.6 : 1, transition: "background .18s ease",
              }}
            >
              {deletePending ? "Eliminando…" : "Eliminar aventura"}
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || savePending}
              style={{
                flex: 1, fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 15,
                color: canSave ? "#1E282A" : "rgba(30,40,42,.6)",
                background: canSave ? "#E3A878" : "rgba(227,168,120,.4)",
                border: "none", borderRadius: 14, padding: "14px",
                cursor: canSave ? "pointer" : "not-allowed",
                boxShadow: canSave ? "0 10px 26px rgba(227,168,120,.22)" : "none",
                transition: "background .2s ease, transform .18s ease",
              }}
            >
              {savePending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
