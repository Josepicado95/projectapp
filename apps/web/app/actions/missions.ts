// app/actions/missions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createMission as createMissionService,
  updateMission as updateMissionService,
  toggleMission as toggleMissionService,
  deleteMission as deleteMissionService,
} from "@/lib/services/missions";
import { NotFoundError } from "@/lib/services/errors";

type ActionState = {
  errors?: { title?: string[]; difficulty?: string[] };
  message?: string;
};

const CreateMissionSchema = z.object({
  adventureId: z.coerce.number().int().positive(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(3),
});

const UpdateMissionSchema = z.object({
  id: z.coerce.number().int().positive(),
  adventureId: z.coerce.number().int().positive(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(3),
});

export async function createMission(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const result = CreateMissionSchema.safeParse({
    adventureId: formData.get("adventureId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    difficulty: formData.get("difficulty"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  try {
    await createMissionService(Number(session.user.id), result.data.adventureId, {
      title: result.data.title,
      description: result.data.description,
      difficulty: result.data.difficulty,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { message: "No se pudo crear la misión" };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath(`/adventures/${result.data.adventureId}`);
  return { message: "¡Misión creada!" };
}

export async function updateMission(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const result = UpdateMissionSchema.safeParse({
    id: formData.get("id"),
    adventureId: formData.get("adventureId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    difficulty: formData.get("difficulty"),
  });

  if (!result.success) return;

  try {
    await updateMissionService(Number(session.user.id), result.data.id, {
      title: result.data.title,
      description: result.data.description,
      difficulty: result.data.difficulty,
    });
  } catch (error) {
    if (error instanceof NotFoundError) return;
    throw error;
  }

  revalidatePath("/");
  revalidatePath(`/adventures/${result.data.adventureId}`);
}

type SaveState = { errors?: { title?: string[] }; message?: string };

export async function saveMission(
  prevState: SaveState,
  formData: FormData
): Promise<SaveState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "error" };

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const adventureId = Number(formData.get("adventureId"));
  const title = String(formData.get("title") ?? "").trim();
  const difficulty = Math.min(3, Math.max(1, Number(formData.get("difficulty")) || 2));

  if (title.length < 3) return { errors: { title: ["El título debe tener al menos 3 caracteres"] } };

  const userId = Number(session.user.id);

  try {
    if (id) {
      await updateMissionService(userId, id, { title, difficulty });
    } else {
      await createMissionService(userId, adventureId, { title, difficulty });
    }
  } catch (error) {
    if (error instanceof NotFoundError) return { message: "error" };
    throw error;
  }

  revalidatePath("/");
  return { message: "ok" };
}

export async function toggleMission(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const id = Number(formData.get("id"));
  const adventureId = Number(formData.get("adventureId"));
  if (!id || !adventureId) return;

  try {
    await toggleMissionService(Number(session.user.id), id);
  } catch (error) {
    if (error instanceof NotFoundError) return;
    throw error;
  }

  revalidatePath("/");
  revalidatePath(`/adventures/${adventureId}`);
}

export async function deleteMission(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const id = Number(formData.get("id"));
  const adventureId = Number(formData.get("adventureId"));
  if (!id || !adventureId) return;

  try {
    await deleteMissionService(Number(session.user.id), id);
  } catch (error) {
    if (error instanceof NotFoundError) return;
    throw error;
  }

  revalidatePath("/");
  revalidatePath(`/adventures/${adventureId}`);
}
