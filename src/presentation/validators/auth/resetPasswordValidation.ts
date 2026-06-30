import { z } from "zod";

/** Body for `POST /auth/reset-password`. */
export const resetPasswordValidation = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});