import { z } from "zod";

/** Body for `POST /auth/resend-verification`. */
export const resendVerificationValidation = z.object({
  email: z.string().email("Email inválido"),
});
