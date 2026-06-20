"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type CheckInState = { message?: string; error?: string };

const CheckInSchema = z.object({
  energy: z.coerce.number().int().min(1).max(5),
  mood: z.coerce.number().int().min(1).max(5),
  stress: z.coerce.number().int().min(1).max(5),
  sleep: z.coerce.number().int().min(1).max(5),
});

export async function saveCheckIn(
  prevState: CheckInState,
  formData: FormData
): Promise<CheckInState> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const userId = Number(session.user.id);

  const result = CheckInSchema.safeParse({
    energy: formData.get("energy"),
    mood: formData.get("mood"),
    stress: formData.get("stress"),
    sleep: formData.get("sleep"),
  });

  if (!result.success) {
    return { error: "Valores inválidos. Asegúrate de que todos estén entre 1 y 5." };
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  const existing = await prisma.checkIn.findFirst({
    where: { userId, date: { gte: startOfDay, lte: endOfDay } },
  });

  if (existing) {
    await prisma.checkIn.update({
      where: { id: existing.id },
      data: result.data,
    });
  } else {
    await prisma.checkIn.create({
      data: { ...result.data, userId },
    });
  }

  revalidatePath("/checkin");
  revalidatePath("/");
  return { message: existing ? "¡Check-in actualizado!" : "¡Check-in guardado!" };
}
