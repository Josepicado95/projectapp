"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

  await prisma.mission.create({
    data: {
      title: result.data.title,
      description: result.data.description,
      difficulty: result.data.difficulty,
      adventureId: result.data.adventureId,
    },
  });

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

  await prisma.mission.update({
    where: { id: result.data.id },
    data: {
      title: result.data.title,
      description: result.data.description,
      difficulty: result.data.difficulty,
    },
  });

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

  if (id) {
    await prisma.mission.update({ where: { id }, data: { title, difficulty } });
  } else {
    await prisma.mission.create({ data: { title, difficulty, adventureId, completed: false } });
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

  const mission = await prisma.mission.findUnique({ where: { id } });
  if (!mission) return;

  await prisma.mission.update({
    where: { id },
    data: {
      completed: !mission.completed,
      completedAt: !mission.completed ? new Date() : null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/adventures/${adventureId}`);
}

export async function deleteMission(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const id = Number(formData.get("id"));
  const adventureId = Number(formData.get("adventureId"));
  if (!id || !adventureId) return;

  await prisma.mission.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath(`/adventures/${adventureId}`);
}
