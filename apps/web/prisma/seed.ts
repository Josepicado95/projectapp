import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // Clean existing data to allow re-running the seed
  await prisma.checkIn.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.adventure.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("aventuras123", 12);

  const user = await prisma.user.create({
    data: {
      email: "jose@aventuras.com",
      name: "Jose",
      password: hashedPassword,
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

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  await prisma.checkIn.createMany({
    data: [
      { userId: user.id, energy: 4, mood: 5, stress: 2, sleep: 4, date: twoDaysAgo },
      { userId: user.id, energy: 3, mood: 3, stress: 3, sleep: 3, date: yesterday },
      { userId: user.id, energy: 5, mood: 4, stress: 1, sleep: 4, date: today },
    ],
  });

  console.log("Seed completado:");
  console.log(`  Usuario: ${user.email} / contraseña: aventuras123`);
  console.log(`  Aventura 1: ${adventure1.title}`);
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
