/**
 * Minimal E.164 phone handling — chosen over `libphonenumber-js` to avoid a new
 * dependency for a single-format check. E.164 is `+` followed by a country digit
 * (1-9) and up to 14 more digits (8–15 digits total).
 */

/** E.164: `+` + leading non-zero digit + 7 to 14 more digits. */
export const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/**
 * Strip common human separators (spaces, dashes, dots, parentheses) so a value
 * like `+55 (11) 99999-9999` normalizes to `+5511999999999`. Does not otherwise
 * transform the number.
 */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s().-]/g, "");
}

/** True when `value` is a valid E.164 number after normalization. */
export function isE164(value: string): boolean {
  return E164_REGEX.test(normalizePhone(value));
}
