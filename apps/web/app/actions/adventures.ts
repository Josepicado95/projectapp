"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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
  const result = AdventureSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await prisma.adventure.create({
    data: {
      title: result.data.title,
      description: result.data.description,
      userId: 1, // hardcoded hasta Fase 5 cuando agreguemos auth
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
  const result = UpdateAdventureSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
  });

  if (!result.success) return;

  await prisma.adventure.update({
    where: { id: result.data.id },
    data: {
      title: result.data.title,
      description: result.data.description,
      status: result.data.status,
    },
  });

  revalidatePath("/");
}

export async function deleteAdventure(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;

  await prisma.mission.deleteMany({ where: { adventureId: id } });
  await prisma.adventure.delete({ where: { id } });

  revalidatePath("/");
}
