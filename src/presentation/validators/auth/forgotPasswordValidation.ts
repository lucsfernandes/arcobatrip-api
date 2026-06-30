import { z } from "zod";

/** Body for `POST /auth/forgot-password`. */
export const forgotPasswordValidation = z.object({
  email: z.string().email("Email inválido"),
});