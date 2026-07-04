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

export async function saveCheckIn(userId: number, input: CheckInInput): Promise<CheckInData> {
  return prisma.checkIn.create({ data: { ...input, userId } });
}

export async function listCheckIns(userId: number, limit: number): Promise<CheckInData[]> {
  return prisma.checkIn.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function listRecentCheckIns(userId: number, days: number): Promise<CheckInData[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.checkIn.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "asc" },
  });
}

export async function getLatestCheckInToday(userId: number): Promise<CheckInData | null> {
  return prisma.checkIn.findFirst({
    where: { userId, date: todayRangeUTC() },
    orderBy: { date: "desc" },
  });
}
