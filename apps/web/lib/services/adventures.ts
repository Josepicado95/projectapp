// lib/services/adventures.ts
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/services/errors";

export type AdventureSummary = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  paletteIdx: number;
  createdAt: Date;
  missionsCount: number;
  completedCount: number;
};

export type MissionData = {
  id: number;
  title: string;
  description: string | null;
  difficulty: number;
  completed: boolean;
  completedAt: Date | null;
};

export type AdventureDetail = AdventureSummary & { missions: MissionData[] };

export type InitialMissionInput = { title: string; difficulty: number };

export type CreateAdventureInput = {
  title: string;
  description?: string;
  paletteIdx: number;
  initialMissions?: InitialMissionInput[];
};

export type UpdateAdventureInput = {
  title: string;
  description?: string;
  status: string;
  paletteIdx: number;
};

function toDetail(
  adventure: {
    id: number;
    title: string;
    description: string | null;
    status: string;
    paletteIdx: number;
    createdAt: Date;
    missions: MissionData[];
  }
): AdventureDetail {
  return {
    id: adventure.id,
    title: adventure.title,
    description: adventure.description,
    status: adventure.status,
    paletteIdx: adventure.paletteIdx,
    createdAt: adventure.createdAt,
    missionsCount: adventure.missions.length,
    completedCount: adventure.missions.filter((m) => m.completed).length,
    missions: adventure.missions,
  };
}

export async function listAdventures(userId: number): Promise<AdventureSummary[]> {
  const adventures = await prisma.adventure.findMany({
    where: { userId },
    include: { missions: true },
    orderBy: { createdAt: "desc" },
  });

  return adventures.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    status: a.status,
    paletteIdx: a.paletteIdx,
    createdAt: a.createdAt,
    missionsCount: a.missions.length,
    completedCount: a.missions.filter((m) => m.completed).length,
  }));
}

export async function listAdventuresWithMissions(userId: number): Promise<AdventureDetail[]> {
  const adventures = await prisma.adventure.findMany({
    where: { userId },
    include: { missions: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return adventures.map(toDetail);
}

export async function getAdventure(userId: number, id: number): Promise<AdventureDetail> {
  const adventure = await prisma.adventure.findUnique({
    where: { id },
    include: { missions: { orderBy: { createdAt: "asc" } } },
  });

  if (!adventure || adventure.userId !== userId) {
    throw new NotFoundError("Aventura no encontrada");
  }

  return toDetail(adventure);
}

export async function createAdventure(
  userId: number,
  input: CreateAdventureInput
): Promise<AdventureDetail> {
  const adventure = await prisma.adventure.create({
    data: {
      title: input.title,
      description: input.description,
      paletteIdx: input.paletteIdx,
      userId,
      ...(input.initialMissions?.length
        ? {
            missions: {
              create: input.initialMissions.map((m) => ({
                title: m.title,
                difficulty: m.difficulty,
                completed: false,
              })),
            },
          }
        : {}),
    },
    include: { missions: { orderBy: { createdAt: "asc" } } },
  });

  return toDetail(adventure);
}

export async function updateAdventure(
  userId: number,
  id: number,
  input: UpdateAdventureInput
): Promise<void> {
  const existing = await prisma.adventure.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new NotFoundError("Aventura no encontrada");
  }

  await prisma.adventure.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      paletteIdx: input.paletteIdx,
    },
  });
}

export async function deleteAdventure(userId: number, id: number): Promise<void> {
  const existing = await prisma.adventure.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new NotFoundError("Aventura no encontrada");
  }

  await prisma.mission.deleteMany({ where: { adventureId: id } });
  await prisma.adventure.delete({ where: { id } });
}

export async function listPendingMissions(
  userId: number
): Promise<{ id: number; title: string; difficulty: number; completed: boolean }[]> {
  const adventures = await prisma.adventure.findMany({
    where: { userId },
    include: { missions: true },
  });

  return adventures.flatMap((a) =>
    a.missions
      .filter((m) => !m.completed)
      .map((m) => ({ id: m.id, title: m.title, difficulty: m.difficulty, completed: m.completed }))
  );
}
