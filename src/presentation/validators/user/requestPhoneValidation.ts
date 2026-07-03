import { z } from "zod";
import { E164_REGEX, normalizePhone } from "../../../application/utils/phone";

/** Body for `POST /users/me/phone` — phone in E.164 (separators normalized). */
export const requestPhoneValidation = z
  .object({
    phoneNumber: z
      .string()
      .transform(normalizePhone)
      .pipe(
        z
          .string()
          .regex(E164_REGEX, "Telefone deve estar no formato E.164 (ex.: +5511999999999)")
      ),
  })
  .strict();
