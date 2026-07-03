/** Derive a display name from the local-part of an email ("ana.souza@x" → "ana.souza"). */
export function localPartOf(email: string): string {
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

/**
 * Human-friendly display name derived from an email's local-part, capitalized —
 * `"ana.souza@x"` → `"Ana Souza"`. Splits the local-part on `.`, `_` and `-`,
 * capitalizes the first letter of each non-empty token (leaving the rest as-is)
 * and joins with a single space. Mirrors the frontend so invited guests without
 * an explicit name render identically on every client.
 */
export function displayNameFromEmail(email: string): string {
  const local = localPartOf(email);
  const name = local
    .split(/[._-]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  // Fall back to the raw local-part when it has no usable alphanumeric tokens
  // (e.g. an all-separator local-part), so we never return an empty name.
  return name.length > 0 ? name : local;
}
