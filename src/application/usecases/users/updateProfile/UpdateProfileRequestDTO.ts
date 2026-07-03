/**
 * Whitelisted profile-edit input. Email is intentionally ABSENT — it is
 * immutable via the API (rejected upstream with 403 `email_immutable`). Every
 * field is optional; the controller/validator guarantees at least one is present.
 */
export interface UpdateProfileRequestDTO {
  userId: string;
  fullName?: string;
  phone?: string;
  /** `YYYY-MM-DD`. */
  birthDate?: string;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
}
