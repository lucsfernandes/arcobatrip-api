import { z } from "zod";

/** Body for `POST /auth/signup` — mirrors the contract `SignupRequest`. */
export const signupValidation = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});
