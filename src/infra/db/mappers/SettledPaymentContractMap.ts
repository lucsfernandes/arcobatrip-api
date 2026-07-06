import { SettledPayment } from "../../../domain/entities/SettledPayment/settledPayment.entity";
import { SettledPaymentContract } from "../../../application/contracts/contract";

/**
 * Translates a {@link SettledPayment} entity into its wire contract
 * `{ id, from, to, amount }` (the shape the mobile/web clients already consume
 * for recorded payments). `amount` is normalized to a JS number.
 */
const toContract = (model: SettledPayment): SettledPaymentContract => ({
  id: model.id,
  from: model.fromId,
  to: model.toId,
  amount:
    typeof model.amount === "string" ? parseFloat(model.amount) : model.amount,
});

export const SettledPaymentContractMap = { toContract };
