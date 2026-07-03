// lib/services/missions.ts
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/services/errors";

export type MissionData = {
  id: number;
  title: string;
  description: string | null;
  difficulty: number;
  completed: boolean;
  completedAt: Date | null;
  adventureId: number;
};

export type NewMissionInput = { title: string; description?: string; difficulty: number };
export type UpdateMissionInput = { title: string; description?: string; difficulty: number };

async function assertMissionOwnership(userId: number, missionId: number) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: { adventure: true },
  });

  if (!mission || mission.adventure.userId !== userId) {
    throw new NotFoundError("Misión no encontrada");
  }

  return mission;
}

async function assertAdventureOwnership(userId: number, adventureId: number) {
  const adventure = await prisma.adventure.findUnique({ where: { id: adventureId } });
  if (!adventure || adventure.userId !== userId) {
    throw new NotFoundError("Aventura no encontrada");
  }
}

export async function createMission(
  userId: number,
  adventureId: number,
  input: NewMissionInput
): Promise<MissionData> {
  await assertAdventureOwnership(userId, adventureId);

  return prisma.mission.create({
    data: {
      title: input.title,
      description: input.description,
      difficulty: input.difficulty,
      adventureId,
      completed: false,
    },
  });
}

export async function updateMission(
  userId: number,
  missionId: number,
  input: UpdateMissionInput
): Promise<MissionData> {
  await assertMissionOwnership(userId, missionId);

  return prisma.mission.update({
    where: { id: missionId },
    data: {
      title: input.title,
      description: input.description,
      difficulty: input.difficulty,
    },
  });
}

export async function toggleMission(userId: number, missionId: number): Promise<MissionData> {
  const mission = await assertMissionOwnership(userId, missionId);

  return prisma.mission.update({
    where: { id: missionId },
    data: {
      completed: !mission.completed,
      completedAt: !mission.completed ? new Date() : null,
    },
  });
}

export async function setMissionCompleted(
  userId: number,
  missionId: number,
  completed: boolean
): Promise<MissionData> {
  await assertMissionOwnership(userId, missionId);

  return prisma.mission.update({
    where: { id: missionId },
    data: { completed, completedAt: completed ? new Date() : null },
  });
}

export async function deleteMission(userId: number, missionId: number): Promise<void> {
  await assertMissionOwnership(userId, missionId);
  await prisma.mission.delete({ where: { id: missionId } });
}
