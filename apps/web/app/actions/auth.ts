"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";

type RegisterState = {
  errors?: { name?: string[]; email?: string[]; password?: string[] };
  general?: string;
};

type LoginState = { error?: string };

const RegisterSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function registerAction(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const result = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const existing = await prisma.user.findUnique({
    where: { email: result.data.email },
  });

  if (existing) {
    return { errors: { email: ["Ya existe una cuenta con ese email"] } };
  }

  const hashedPassword = await bcrypt.hash(result.data.password, 12);

  await prisma.user.create({
    data: {
      name: result.data.name,
      email: result.data.email,
      password: hashedPassword,
    },
  });

  redirect("/login");
}

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos" };
    }
    throw error;
  }
  return {};
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
