import { z } from "zod";
import { E164_REGEX, normalizePhone } from "../../../application/utils/phone";

/** Reusable E.164 field: normalizes human separators, then validates. */
const e164Schema = z
  .string()
  .transform(normalizePhone)
  .pipe(
    z
      .string()
      .regex(E164_REGEX, "Telefone deve estar no formato E.164 (ex.: +5511999999999)")
  );

/**
 * Body for `PATCH /users/me`. STRICT whitelist — unknown keys (including any
 * attempt to send `email`, though that is caught earlier with 403) are rejected.
 * All fields optional, but at least one must be present.
 */
export const updateProfileValidation = z
  .object({
    fullName: z.string().trim().min(1, "Nome não pode ser vazio").max(120).optional(),
    phone: e164Schema.optional(),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
      .optional(),
    bio: z.string().max(500, "Bio muito longa").nullable().optional(),
    city: z.string().max(120).nullable().optional(),
    country: z.string().max(120).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Envie ao menos um campo para atualizar",
  });
