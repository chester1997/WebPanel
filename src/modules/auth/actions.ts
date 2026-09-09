"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { hashPassword } from "@/lib/security/password";
import { loginSchema, registerSchema, createTenantSchema } from "./validation";
import { requireUser, setActiveTenantCookie } from "@/lib/auth/session";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.orm.public.User.first({ email });
  if (existing) {
    return { error: "Já existe uma conta com este e-mail." };
  }

  const passwordHash = await hashPassword(password);
  await db.orm.public.User.create({
    name,
    email,
    passwordHash,
    status: "ACTIVE",
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Conta criada, mas não foi possível entrar automaticamente. Faça login." };
    }
    throw error;
  }

  redirect("/onboarding");
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Informe e-mail e senha válidos." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha incorretos." };
    }
    // Erro de redirecionamento do Next.js (NEXT_REDIRECT) — não é um erro real, deixa propagar.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    // Outros erros (ex: banco de dados fora do ar) — nunca expor detalhes internos ao usuário.
    console.error("[loginAction] erro inesperado:", error);
    return { error: "Não foi possível entrar. Tente novamente em instantes." };
  }

  redirect("/dashboard");
}

export async function createTenantAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = createTenantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, slug } = parsed.data;

  const existingSlug = await db.orm.public.Tenant.first({ slug });
  if (existingSlug) {
    return { fieldErrors: { slug: "Este identificador já está em uso." } };
  }

  const tenant = await db.orm.public.Tenant.create({
    name,
    slug,
    status: "ACTIVE",
  });

  await db.orm.public.Membership.create({
    userId: user.id,
    tenantId: tenant.id,
    role: "OWNER",
  });

  await setActiveTenantCookie(tenant.id);

  redirect("/dashboard");
}
