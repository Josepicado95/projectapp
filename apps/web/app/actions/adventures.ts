// app/actions/adventures.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createAdventure as createAdventureService,
  updateAdventure as updateAdventureService,
  deleteAdventure as deleteAdventureService,
} from "@/lib/services/adventures";

const AdventureSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  paletteIdx: z.coerce.number().min(0).max(4).default(0),
});

type ActionState = {
  errors?: { title?: string[]; description?: string[] };
  message?: string;
};

export async function createAdventure(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const userId = Number(session.user.id);

  const result = AdventureSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    paletteIdx: formData.get("paletteIdx") ?? 0,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const initialMissionNames = (formData.getAll("initialMission") as string[]).map((n) => n.trim()).filter(Boolean);
  const initialMissionDiffs = (formData.getAll("initialMissionDiff") as string[]).map((d) => Math.min(3, Math.max(1, Number(d) || 2)));

  const initialMissions = initialMissionNames.map((title, i) => ({
    title,
    difficulty: initialMissionDiffs[i] ?? 2,
  }));

  await createAdventureService(userId, {
    title: result.data.title,
    description: result.data.description,
    paletteIdx: result.data.paletteIdx,
    initialMissions,
  });

  revalidatePath("/");
  return { message: "¡Aventura creada!" };
}

const UpdateAdventureSchema = z.object({
  id: z.coerce.number(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "paused"]),
  paletteIdx: z.coerce.number().min(0).max(4).default(0),
});

export async function updateAdventure(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const result = UpdateAdventureSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    paletteIdx: formData.get("paletteIdx") ?? 0,
  });

  if (!result.success) {
    throw new Error("Datos inválidos al actualizar la aventura");
  }

  await updateAdventureService(Number(session.user.id), result.data.id, {
    title: result.data.title,
    description: result.data.description,
    status: result.data.status,
    paletteIdx: result.data.paletteIdx,
  });

  revalidatePath("/");
}

export async function deleteAdventure(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const id = Number(formData.get("id"));
  if (!id) return;

  await deleteAdventureService(Number(session.user.id), id);

  revalidatePath("/");
}
