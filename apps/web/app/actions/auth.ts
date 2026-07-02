"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { registerUser } from "@/lib/services/auth";
import { ConflictError } from "@/lib/services/errors";

type RegisterState = {
  errors?: { name?: string[]; email?: string[]; password?: string[] };
  general?: string;
};

type LoginState = { error?: string; success?: boolean };

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

  try {
    await registerUser(result.data.name, result.data.email, result.data.password);
  } catch (error) {
    if (error instanceof ConflictError) {
      return { errors: { email: [error.message] } };
    }
    throw error;
  }

  redirect("/login?registered=true");
}

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos" };
    }
    throw error;
  }
  return { success: true };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
