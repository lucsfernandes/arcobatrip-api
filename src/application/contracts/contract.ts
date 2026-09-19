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

/**
 * Rich profile view of the authenticated user, returned by the `/users/me`
 * resource (GET / PATCH / avatar / phone). Superset of {@link UserContract} —
 * `UserContract` stays minimal for the auth flows (login/signup/me), while this
 * shape carries the editable profile fields plus verification flags. Optional
 * string fields are `null` (not omitted) when unset so the frontend can bind a
 * form field directly.
 */
export interface UserProfileContract {
  id: ID;
  name: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  /** ISO date ("YYYY-MM-DD") or null. */
  birthDate: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  avatarUrl: string | null;
  accent: string | null;
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
  /** Free-form description; omitted when unset. */
  description?: string;
  /** Cloudinary banner URL; omitted when unset. */
  bannerUrl?: string;
}

export interface TripLinkContract {
  id: ID;
  label: string;
  url: string;
  /** OPTIONAL activity this link belongs to; omitted for trip-level links. */
  activityId?: ID;
}

export interface ActivityCommentContract {
  id: ID;
  activityId: ID;
  authorId: ID;
  authorName: string;
  body: string;
  /** ISO datetime. */
  createdAt: string;
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
  /** OPTIONAL activity this expense is tagged to; omitted for general expenses. */
  activityId?: ID;
}

/** A "who pays whom" settlement line (computed, never persisted). */
export interface SettlementContract {
  fromId: ID;
  toId: ID;
  amount: number;
}

/**
 * A recorded settlement payment ("pagamento registrado" / acerto de contas):
 * participant `from` paid participant `to` `amount` reais. Unlike
 * {@link SettlementContract} (an ephemeral suggestion), these ARE persisted.
 * They are subtracted from the balances before the pending settlements are
 * recomputed, so the `settlements` array already discounts them.
 */
export interface SettledPaymentContract {
  id: ID;
  from: ID;
  to: ID;
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
  /**
   * Long-lived refresh token. Exposed in the JSON body so the mobile app (React
   * Native — ignores cookies) can renew its short-lived `token` via
   * `POST /auth/refresh`. The web ALSO receives it as the HttpOnly `refresh_token`
   * cookie and keeps using the cookie; this field is additive, not a replacement.
   */
  refreshToken: string;
  user: UserContract;
}

/** Response envelope for `GET`/`POST /trips/{id}/expenses`. */
export interface ExpensesResponseContract {
  expenses: ExpenseContract[];
  /**
   * PENDING "who-pays-whom" lines, already discounting {@link settledPayments}
   * (each recorded payment is applied to the balances before recomputing).
   */
  settlements: SettlementContract[];
  /** Recorded settlement payments (acertos) persisted for the trip. */
  settledPayments: SettledPaymentContract[];
}
