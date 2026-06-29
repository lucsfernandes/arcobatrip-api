/**
 * Canonical API contract shapes.
 *
 * These interfaces mirror, 1:1, the frontend's `web/src/data/types.ts` and the
 * OpenAPI document (`api-contract/openapi.yaml`). They are the EXACT JSON bodies
 * the HTTP layer must emit. They are intentionally decoupled from the persistence
 * entities — the `*ContractMap` mappers translate entities into these shapes.
 *
 * The `Contract` suffix avoids collisions with the TypeORM entity classes
 * (`User`, `Trip`, `Activity`, `Link`, `Participant`).
 */

export type ID = string;

export type GuestStatus = "host" | "confirmed" | "pending";
export type ActivityStatus = "done" | "pending";
export type TripStatus = "active" | "upcoming" | "past";
export type ExpenseCategory =
  | "hospedagem"
  | "transporte"
  | "alimentacao"
  | "passeio"
  | "compras"
  | "outros";
export type NotificationType =
  | "convite"
  | "confirmacao"
  | "atividade"
  | "link"
  | "lembrete";

/** Tuple of every {@link ExpenseCategory}, for runtime validation. */
export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  "hospedagem",
  "transporte",
  "alimentacao",
  "passeio",
  "compras",
  "outros",
] as const;

/** Tuple of every {@link GuestStatus}, for runtime validation. */
export const GUEST_STATUSES: readonly GuestStatus[] = [
  "host",
  "confirmed",
  "pending",
] as const;

/** Tuple of every {@link ActivityStatus}, for runtime validation. */
export const ACTIVITY_STATUSES: readonly ActivityStatus[] = [
  "done",
  "pending",
] as const;

export interface UserContract {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  accent?: string;
  /** ISO date ("YYYY-MM-DD") the user joined. */
  memberSince: string;
}

export interface GuestContract {
  id: ID;
  name: string;
  email: string;
  status: GuestStatus;
  accent?: string;
  avatarUrl?: string;
}

export interface ActivityContract {
  id: ID;
  title: string;
  /** ISO datetime. */
  at: string;
  status: ActivityStatus;
}

export interface TripLinkContract {
  id: ID;
  label: string;
  url: string;
}

export interface TripContract {
  id: ID;
  destination: string;
  /** ISO date ("YYYY-MM-DD"). */
  startDate: string;
  /** ISO date ("YYYY-MM-DD"). */
  endDate: string;
  status: TripStatus;
  coverUrl?: string;
  guests: GuestContract[];
  activities: ActivityContract[];
  links: TripLinkContract[];
}

export interface ExpenseContract {
  id: ID;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidById: ID;
  splitBetween: ID[];
}

/** A "who pays whom" settlement line (computed, never persisted). */
export interface SettlementContract {
  fromId: ID;
  toId: ID;
  amount: number;
}

export interface NotificationContract {
  id: ID;
  type: NotificationType;
  title: string;
  body: string;
  /** ISO datetime. */
  at: string;
  read: boolean;
  tripId?: ID;
}

/** Response envelope for `/auth/login` and `/auth/signup`. */
export interface AuthResponseContract {
  token: string;
  user: UserContract;
}

/** Response envelope for `GET`/`POST /trips/{id}/expenses`. */
export interface ExpensesResponseContract {
  expenses: ExpenseContract[];
  settlements: SettlementContract[];
}
