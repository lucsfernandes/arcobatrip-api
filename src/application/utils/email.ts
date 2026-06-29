/** Derive a display name from the local-part of an email ("ana.souza@x" → "ana.souza"). */
export function localPartOf(email: string): string {
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}
