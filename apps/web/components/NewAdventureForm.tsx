"use client";

import { useActionState, useEffect } from "react";
import { createAdventure } from "@/app/actions/adventures";

const initialState: { errors?: { title?: string[] }; message?: string } = {};

const INPUT: React.CSSProperties = {
  border: "1px solid #D8D1C4",
  borderRadius: 12,
  padding: "11px 14px",
  fontSize: 14,
  color: "#2A332D",
  outline: "none",
  background: "#FBF8F1",
  width: "100%",
  boxSizing: "border-box",
};

export default function NewAdventureForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(createAdventure, initialState);

  useEffect(() => {
    if (state.message) onSuccess?.();
  }, [state.message]);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        name="title"
        placeholder="¿Qué quieres lograr?"
        required
        style={INPUT}
      />
      {state.errors?.title && (
        <p style={{ fontSize: 12, color: "#C97B7B", margin: 0 }}>{state.errors.title[0]}</p>
      )}
      <input
        name="description"
        placeholder="Descripción (opcional)"
        style={INPUT}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            fontFamily: "var(--font-hanken)", fontWeight: 600, fontSize: 14,
            color: "#FBF8F1", background: pending ? "#8A8D85" : "#2A332D",
            border: "none", borderRadius: 999, padding: "11px 22px",
            cursor: pending ? "not-allowed" : "pointer",
            transition: "background .2s",
          }}
        >
          {pending ? "Creando..." : "Crear aventura →"}
        </button>
      </div>
    </form>
  );
}
