// lib/services/checkins.ts
import { prisma } from "@/lib/prisma";

export type CheckInInput = { energy: number; mood: number; stress: number; sleep: number };
export type CheckInData = CheckInInput & { id: number; date: Date; userId: number };

function todayRangeUTC(): { gte: Date; lte: Date } {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);
  return { gte: startOfDay, lte: endOfDay };
}

export async function saveCheckIn(
  userId: number,
  input: CheckInInput
): Promise<{ checkIn: CheckInData; created: boolean }> {
  const existing = await prisma.checkIn.findFirst({
    where: { userId, date: todayRangeUTC() },
  });

  if (existing) {
    const checkIn = await prisma.checkIn.update({ where: { id: existing.id }, data: input });
    return { checkIn, created: false };
  }

  const checkIn = await prisma.checkIn.create({ data: { ...input, userId } });
  return { checkIn, created: true };
}

export async function listCheckIns(userId: number, limit: number): Promise<CheckInData[]> {
  return prisma.checkIn.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getTodayCheckIn(userId: number): Promise<CheckInData | null> {
  return prisma.checkIn.findFirst({
    where: { userId, date: todayRangeUTC() },
  });
}
