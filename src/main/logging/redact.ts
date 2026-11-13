import winston from "winston";

export const REDACTED = "[REDACTED]";

/**
 * Keys whose value is never logged, whatever it holds. Matched anywhere in the
 * key (`refreshToken`, `set-cookie`, `x-api-key`…). Deliberately not `code`: an
 * error's `code` ("ECONNREFUSED") is useful and not a secret.
 */
const SENSITIVE_KEY =
  /pass(word|wd)?|secret|token|authorization|cookie|api[-_]?key|credential|jwt|bearer|signature/i;

/** Patterns that give a secret away even inside free text (a message, a URL, a stack). */
const VALUE_PATTERNS: [RegExp, string][] = [
  // JSON Web Tokens.
  [/\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*/g, REDACTED],
  // "Bearer <token>".
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`],
  // Secrets in a query string: ?token=…, &password=…
  [/([?&](?:[a-z_]*token|code|key|password|secret|signature)=)[^&#\s"']+/gi, `$1${REDACTED}`],
  // The raw e-mailed links carry 64 hex characters (32 random bytes).
  [/\b[0-9a-f]{64}\b/gi, REDACTED],
  // E-mail addresses are personal data: the logs only need to know one was there.
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g, "[email]"],
];

const MAX_DEPTH = 8;

function scrubString(value: string): string {
  return VALUE_PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

/**
 * A copy of `value` with every secret replaced. Never mutates the input, copes
 * with cycles and caps the depth. Errors keep their name, message and stack.
 */
export function redact(value: unknown, depth = 0, seen: WeakSet<object> = new WeakSet()): unknown {
  if (typeof value === "string") return scrubString(value);
  if (value === null || typeof value !== "object") return value;
  if (depth >= MAX_DEPTH) return "[Truncated]";
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (value instanceof Error) {
    return {
      name: value.name,
      message: scrubString(value.message),
      stack: value.stack ? scrubString(value.stack) : undefined,
    };
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1, seen));

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? REDACTED : redact(item, depth + 1, seen),
    ])
  );
}

/** Winston format: redacts the message and every field of each log entry. */
export const redactFormat = winston.format((info) => {
  for (const key of Object.keys(info)) {
    if (key === "level") continue;
    info[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(info[key]);
  }
  return info;
});

/**
 * Winston format: entries are `app` logs unless they say otherwise (the request
 * log sets `access`), so the two kinds can be told apart and kept for different
 * times (see the k3s log retention).
 */
export const logTypeFormat = winston.format((info) => {
  if (!info.log_type) info.log_type = "app";
  return info;
});
