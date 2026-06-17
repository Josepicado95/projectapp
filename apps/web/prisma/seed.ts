import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // Clean existing data to allow re-running the seed
  await prisma.checkIn.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.adventure.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "jose@aventuras.com",
      name: "Jose",
      password: "placeholder-hasta-fase-5",
    },
  });

  const adventure1 = await prisma.adventure.create({
    data: {
      title: "Aprender programación",
      description: "Construir una app full-stack desde cero",
      status: "active",
      userId: user.id,
      missions: {
        create: [
          { title: "Completar Fase 1 del roadmap", difficulty: 1, completed: true },
          { title: "Completar Fase 2 del roadmap", difficulty: 1, completed: true },
          { title: "Montar PostgreSQL con Docker", difficulty: 2, completed: false },
          { title: "Escribir el schema de Prisma", difficulty: 2, completed: false },
          { title: "Conectar el frontend a la DB real", difficulty: 3, completed: false },
        ],
      },
    },
  });

  const adventure2 = await prisma.adventure.create({
    data: {
      title: "Mejorar condición física",
      description: "Correr 5km sin parar en 3 meses",
      status: "active",
      userId: user.id,
      missions: {
        create: [
          { title: "Correr 1km sin parar", difficulty: 1, completed: false },
          { title: "Correr 3km sin parar", difficulty: 2, completed: false },
          { title: "Correr 5km sin parar", difficulty: 3, completed: false },
        ],
      },
    },
  });

  await prisma.checkIn.createMany({
    data: [
      { userId: user.id, energy: 4, mood: 5, stress: 2, sleep: 8 },
      { userId: user.id, energy: 3, mood: 3, stress: 3, sleep: 6 },
      { userId: user.id, energy: 5, mood: 4, stress: 1, sleep: 7 },
    ],
  });

  console.log("Seed completado:");
  console.log(`  Usuario: ${user.email}`);
  console.log(`  Aventura 1: ${adventure1.title} (${adventure1.missions} misiones)`);
  console.log(`  Aventura 2: ${adventure2.title}`);
  console.log("  3 check-ins creados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
