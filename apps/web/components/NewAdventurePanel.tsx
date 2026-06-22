"use client";

import { useState, useRef } from "react";
import NewAdventureForm from "./NewAdventureForm";

const GLASS: React.CSSProperties = {
  background: "rgba(251,248,241,.95)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,.7)",
  borderRadius: 18,
  boxShadow: "0 16px 48px rgba(42,51,45,.18)",
};

type Props = { fullWidth?: boolean };

export default function NewAdventurePanel({ fullWidth }: Props) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ bottom: 90, left: 44 });
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPanelPos({
        bottom: window.innerHeight - rect.top + 8,
        left: Math.max(8, rect.right - 380),
      });
    }
    setOpen(true);
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 14,
          color: "#FBF8F1", background: "#2A332D",
          border: "none", borderRadius: 999,
          padding: fullWidth ? "13px" : "11px 22px",
          width: fullWidth ? "100%" : undefined,
          cursor: "pointer", boxShadow: "0 8px 24px rgba(42,51,45,.28)",
          display: "flex", alignItems: "center",
          justifyContent: fullWidth ? "center" : "flex-start",
          gap: 8,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E3A878", flexShrink: 0 }} />
        Nueva aventura
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
          />
          <div style={{
            ...GLASS,
            position: "fixed",
            left: panelPos.left,
            bottom: panelPos.bottom,
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
