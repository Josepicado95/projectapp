"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const AdventureSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
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
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const initialMissionNames = (formData.getAll("initialMission") as string[]).map((n) => n.trim()).filter(Boolean);
  const initialMissionDiffs = (formData.getAll("initialMissionDiff") as string[]).map((d) => Math.min(3, Math.max(1, Number(d) || 2)));

  const missionData = initialMissionNames.map((title, i) => ({
    title,
    difficulty: initialMissionDiffs[i] ?? 2,
    completed: false,
  }));

  await prisma.adventure.create({
    data: {
      title: result.data.title,
      description: result.data.description,
      userId,
      ...(missionData.length > 0 && {
        missions: { create: missionData },
      }),
    },
  });

  revalidatePath("/");
  return { message: "¡Aventura creada!" };
}

const UpdateAdventureSchema = z.object({
  id: z.coerce.number(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "paused"]),
});

export async function updateAdventure(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const result = UpdateAdventureSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
  });

  if (!result.success) {
    throw new Error("Datos inválidos al actualizar la aventura");
  }

  await prisma.adventure.update({
    where: { id: result.data.id, userId: Number(session.user.id) },
    data: {
      title: result.data.title,
      description: result.data.description,
      status: result.data.status,
    },
  });

  revalidatePath("/");
}

export async function deleteAdventure(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const id = Number(formData.get("id"));
  if (!id) return;

  await prisma.mission.deleteMany({ where: { adventureId: id } });
  await prisma.adventure.delete({
    where: { id, userId: Number(session.user.id) },
  });

  revalidatePath("/");
}
