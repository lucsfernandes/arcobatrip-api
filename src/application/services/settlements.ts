import { ExpenseContract, SettlementContract } from "../contracts/contract";

/**
 * Net balance per member: positive means the group owes them money, negative
 * means they owe the group. Each expense credits the payer for the full amount
 * and debits every split participant their equal share.
 *
 * Ported VERBATIM from the frontend (`web/src/lib/expenses.ts` /
 * `mobile/src/lib/expenses.ts`) so the backend settles identically to both
 * clients.
 */
export function computeBalances(
  expenses: ExpenseContract[],
  memberIds: string[]
): Record<string, number> {
  const bal: Record<string, number> = Object.fromEntries(
    memberIds.map((id) => [id, 0])
  );
  for (const e of expenses) {
    bal[e.paidById] = (bal[e.paidById] ?? 0) + e.amount;
    const share = e.amount / e.splitBetween.length;
    for (const id of e.splitBetween) bal[id] = (bal[id] ?? 0) - share;
  }
  for (const id of Object.keys(bal)) bal[id] = Math.round(bal[id] * 100) / 100;
  return bal;
}

/**
 * Greedy "who pays whom" minimization: repeatedly match the largest debtor
 * against the largest creditor until everyone nets to zero. Ported verbatim
 * from the frontend.
 */
export function computeSettlements(
  balances: Record<string, number>
): SettlementContract[] {
  const debtors = Object.entries(balances)
    .filter(([, b]) => b < -0.005)
    .map(([id, b]) => ({ id, amt: -b }))
    .sort((a, b) => b.amt - a.amt);
  const creditors = Object.entries(balances)
    .filter(([, b]) => b > 0.005)
    .map(([id, b]) => ({ id, amt: b }))
    .sort((a, b) => b.amt - a.amt);
  const out: SettlementContract[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay =
      Math.round(Math.min(debtors[i].amt, creditors[j].amt) * 100) / 100;
    if (pay > 0)
      out.push({ fromId: debtors[i].id, toId: creditors[j].id, amount: pay });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt < 0.005) i++;
    if (creditors[j].amt < 0.005) j++;
  }
  return out;
}

/**
 * Convenience composition used by the expense use cases: compute the settlement
 * lines for a trip given its expenses and the full set of member (participant)
 * ids that make up the group.
 */
export function settlementsFor(
  expenses: ExpenseContract[],
  memberIds: string[]
): SettlementContract[] {
  return computeSettlements(computeBalances(expenses, memberIds));
}
