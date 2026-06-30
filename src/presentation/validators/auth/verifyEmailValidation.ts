import { z } from "zod";

/** Body for `POST /auth/verify-email`. */
export const verifyEmailValidation = z.object({
  token: z.string().min(1, "Token é obrigatório"),
});
