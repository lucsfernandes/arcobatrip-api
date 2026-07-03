import { z } from "zod";

/** Body for `POST /users/me/phone/verify` — the emailed 6-digit code. */
export const verifyPhoneValidation = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Código deve ter 6 dígitos"),
  })
  .strict();
