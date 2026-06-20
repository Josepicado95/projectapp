"use client";

import { useState } from "react";
import NewAdventureForm from "./NewAdventureForm";

const GLASS: React.CSSProperties = {
  background: "rgba(251,248,241,.95)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,.7)",
  borderRadius: 18,
  boxShadow: "0 16px 48px rgba(42,51,45,.18)",
};

export default function NewAdventurePanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 14,
          color: "#FBF8F1", background: "#2A332D",
          border: "none", borderRadius: 999, padding: "11px 22px",
          cursor: "pointer", boxShadow: "0 8px 24px rgba(42,51,45,.28)",
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E3A878", flexShrink: 0 }} />
        Nueva aventura
      </button>

      {open && (
        <>
          {/* Backdrop: click fuera para cerrar */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
          />
          {/* Panel flotante */}
          <div style={{
            ...GLASS,
            position: "fixed",
            left: 44,
            bottom: 90,
            width: 380,
            padding: "20px 22px",
            zIndex: 50,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--font-schibsted)", fontWeight: 600, fontSize: 17, color: "#2A332D" }}>
                Nueva aventura
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", fontSize: 20, color: "#8A8D85", cursor: "pointer", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <NewAdventureForm onSuccess={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
