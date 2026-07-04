import { z } from "zod";

/** Body for `POST /trips` — mirrors the contract `CreateTripRequest`. */
export const createTripValidation = z.object({
  destination: z.string().min(1, "Destino é obrigatório"),
  startDate: z.string().min(1, "Data de ida é obrigatória"),
  endDate: z.string().min(1, "Data de volta é obrigatória"),
  guestEmails: z.array(z.string().email("Email de convidado inválido")).optional(),
});

/** Body for `POST /trips/{id}/activities`. */
export const createActivityValidation = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  at: z.string().min(1, "Data/hora é obrigatória"),
  status: z.enum(["done", "pending"]),
  description: z.string().trim().optional(),
});

/**
 * Body for `PATCH /trips/{id}/activities/{activityId}`. All fields optional
 * (partial update); at least one must be provided.
 */
export const updateActivityValidation = z
  .object({
    title: z.string().min(1, "Título é obrigatório").optional(),
    at: z.string().min(1, "Data/hora é obrigatória").optional(),
    status: z.enum(["done", "pending"]).optional(),
    description: z.string().trim().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Informe ao menos um campo para atualizar",
  });

/** Body for `POST /trips/{id}/links`. */
export const createLinkValidation = z.object({
  label: z.string().min(1, "Rótulo é obrigatório"),
  url: z.string().min(1, "URL é obrigatória"),
});

/**
 * An http/https URL. Rejects any other scheme (e.g. `javascript:`, `data:`,
 * `file:`) — a defense-in-depth reinforcement of the same guard applied on the
 * frontend, so a stored link can never carry an executable/pseudo-protocol URL.
 */
const httpUrl = z
  .string()
  .trim()
  .min(1, "URL é obrigatória")
  .refine(
    (value) => {
      try {
        const { protocol } = new URL(value);
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "A URL deve começar com http:// ou https://" }
  );

/** Body for `POST /trips/{id}/activities/{activityId}/links`. */
export const createActivityLinkValidation = z.object({
  label: z.string().trim().min(1, "Rótulo é obrigatório"),
  url: httpUrl,
});

/** Body for `POST /trips/{id}/activities/{activityId}/comments`. */
export const createCommentValidation = z.object({
  body: z.string().trim().min(1, "Comentário não pode ser vazio"),
});

/** Body for `POST /trips/{id}/guests`. */
export const createGuestValidation = z.object({
  email: z.string().email("Email inválido"),
  /** Optional; when blank/absent the name is derived from the email, capitalized. */
  name: z.string().trim().min(1, "Nome não pode ser vazio").optional(),
});

/** Body for `PATCH /trips/{id}/guests/{guestId}`. */
export const updateGuestStatusValidation = z.object({
  status: z.enum(["host", "confirmed", "pending"]),
});
