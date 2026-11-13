import { z } from "zod";

/** Body for `POST /users/me/deletion/confirm` — the token from the e-mailed link. */
export const confirmAccountDeletionValidation = z
  .object({
    token: z.string().min(1, "Token é obrigatório"),
  })
  .strict();
