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
});

/** Body for `POST /trips/{id}/links`. */
export const createLinkValidation = z.object({
  label: z.string().min(1, "Rótulo é obrigatório"),
  url: z.string().min(1, "URL é obrigatória"),
});

/** Body for `POST /trips/{id}/guests`. */
export const createGuestValidation = z.object({
  email: z.string().email("Email inválido"),
});

/** Body for `PATCH /trips/{id}/guests/{guestId}`. */
export const updateGuestStatusValidation = z.object({
  status: z.enum(["host", "confirmed", "pending"]),
});
