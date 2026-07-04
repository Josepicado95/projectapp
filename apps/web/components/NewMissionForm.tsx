"use client";

import { useState } from "react";

type SaveState = { status: "idle" | "saving" | "error"; error?: string };

type Props = {
  adventureId: number;
  onCreated: () => void;
};

export default function NewMissionForm({ adventureId, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveState({ status: "saving" });
    try {
      const res = await fetch(`/api/mobile/adventures/${adventureId}/missions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: description || undefined, difficulty }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveState({ status: "error", error: body?.error?.message ?? "No se pudo crear la misión." });
        return;
      }
      setTitle("");
      setDescription("");
      setDifficulty(1);
      setSaveState({ status: "idle" });
      onCreated();
    } catch {
      setSaveState({ status: "error", error: "No se pudo crear la misión." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 mb-6 bg-gray-50">
      <h3 className="font-medium mb-3">Nueva misión</h3>

      <div className="mb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la misión"
          required
          className="border rounded px-2 py-1 w-full"
        />
      </div>

      <div className="mb-3">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
          className="border rounded px-2 py-1 w-full"
        />
      </div>

      <div className="mb-3">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          <option value="1">Fácil</option>
          <option value="2">Media</option>
          <option value="3">Difícil</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={saveState.status === "saving"}
        className="bg-indigo-500 text-white px-4 py-1 rounded disabled:opacity-50"
      >
        {saveState.status === "saving" ? "Agregando..." : "Agregar misión"}
      </button>

      {saveState.status === "error" && (
        <p className="text-red-500 text-sm mt-2">{saveState.error}</p>
      )}
    </form>
  );
}
