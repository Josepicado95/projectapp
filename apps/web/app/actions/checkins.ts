// app/actions/checkins.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { saveCheckIn as saveCheckInService } from "@/lib/services/checkins";

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

  const { created } = await saveCheckInService(userId, result.data);

  revalidatePath("/checkin");
  revalidatePath("/");
  return { message: created ? "¡Check-in guardado!" : "¡Check-in actualizado!" };
}
