import { z } from "zod";

/** Body for `POST /trips/{id}/expenses` — mirrors the contract `CreateExpenseRequest`. */
export const createExpenseValidation = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  amount: z.number().min(0, "Valor deve ser maior ou igual a zero"),
  category: z.enum([
    "hospedagem",
    "transporte",
    "alimentacao",
    "passeio",
    "compras",
    "outros",
  ]),
  paidById: z.string().min(1, "paidById é obrigatório"),
  splitBetween: z.array(z.string().min(1)).min(1, "Informe ao menos um participante"),
});
