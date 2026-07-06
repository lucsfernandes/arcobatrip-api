import { z } from "zod";

/**
 * Body for `POST /trips/{id}/settlements` — mirrors the contract
 * `{ from, to, amount }`. Participant membership of `from`/`to` is enforced in
 * the use case (they must belong to the trip).
 */
export const createSettlementValidation = z.object({
  from: z.string().min(1, "from é obrigatório"),
  to: z.string().min(1, "to é obrigatório"),
  amount: z.number().positive("amount deve ser maior que zero"),
});
