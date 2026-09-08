import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo"),
  email: z.string().trim().email("E-mail inválido"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/[a-z]/, "A senha deve conter ao menos uma letra minúscula")
    .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
    .regex(/[0-9]/, "A senha deve conter ao menos um número"),
});

export const createTenantSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da loja"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "O identificador deve ter pelo menos 3 caracteres")
    .max(50, "O identificador deve ter no máximo 50 caracteres")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens"
    ),
});
