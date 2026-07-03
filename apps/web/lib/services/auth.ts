// lib/services/auth.ts
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ConflictError } from "@/lib/services/errors";

export type PublicUser = { id: number; name: string; email: string };

export async function verifyCredentials(
  email: string,
  password: string
): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) return null;

  return { id: user.id, name: user.name, email: user.email };
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("Ya existe una cuenta con ese email");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  return { id: user.id, name: user.name, email: user.email };
}
