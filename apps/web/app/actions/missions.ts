"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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

  revalidatePath(`/adventures/${result.data.adventureId}`);
  return { message: "¡Misión creada!" };
}

export async function updateMission(formData: FormData): Promise<void> {
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

  revalidatePath(`/adventures/${result.data.adventureId}`);
}

export async function toggleMission(formData: FormData): Promise<void> {
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

  revalidatePath(`/adventures/${adventureId}`);
}

export async function deleteMission(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const adventureId = Number(formData.get("adventureId"));
  if (!id || !adventureId) return;

  await prisma.mission.delete({ where: { id } });
  revalidatePath(`/adventures/${adventureId}`);
}
