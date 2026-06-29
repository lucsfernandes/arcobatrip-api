import {
  computeBalances,
  computeSettlements,
  settlementsFor,
} from "../../../application/services/settlements";
import { ExpenseContract } from "../../../application/contracts/contract";

const expense = (over: Partial<ExpenseContract>): ExpenseContract => ({
  id: "e1",
  title: "x",
  amount: 0,
  category: "outros",
  paidById: "a",
  splitBetween: ["a"],
  ...over,
});

describe("settlements (ported verbatim from the frontend)", () => {
  describe("computeBalances", () => {
    it("credits the payer and debits each split member their equal share", () => {
      const balances = computeBalances(
        [expense({ amount: 90, paidById: "a", splitBetween: ["a", "b", "c"] })],
        ["a", "b", "c"]
      );
      expect(balances).toEqual({ a: 60, b: -30, c: -30 });
    });

    it("rounds every balance to cents", () => {
      const balances = computeBalances(
        [expense({ amount: 100, paidById: "a", splitBetween: ["a", "b", "c"] })],
        ["a", "b", "c"]
      );
      // 100/3 = 33.333...  → a = 100 - 33.33 = 66.67, b/c = -33.33
      expect(balances.a).toBeCloseTo(66.67, 2);
      expect(balances.b).toBeCloseTo(-33.33, 2);
      expect(balances.c).toBeCloseTo(-33.33, 2);
    });

    it("initializes every member to zero even with no expenses", () => {
      expect(computeBalances([], ["a", "b"])).toEqual({ a: 0, b: 0 });
    });
  });

  describe("computeSettlements", () => {
    it("greedily matches the largest debtor to the largest creditor", () => {
      const settlements = computeSettlements({ a: 60, b: -30, c: -30 });
      expect(settlements).toEqual([
        { fromId: "b", toId: "a", amount: 30 },
        { fromId: "c", toId: "a", amount: 30 },
      ]);
    });

    it("returns nothing when everyone nets to zero", () => {
      expect(computeSettlements({ a: 0, b: 0 })).toEqual([]);
    });
  });

  describe("settlementsFor", () => {
    it("composes balances + settlements for a trip", () => {
      const settlements = settlementsFor(
        [expense({ amount: 90, paidById: "a", splitBetween: ["a", "b", "c"] })],
        ["a", "b", "c"]
      );
      const total = settlements.reduce((s, x) => s + x.amount, 0);
      expect(total).toBeCloseTo(60, 2);
      expect(settlements.every((s) => s.toId === "a")).toBe(true);
    });
  });
});
