/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/** A single per-field validation issue, matching the contract `Error.details`. */
export interface ErrorDetail {
  path: string;
  message: string;
}

/**
 * Application/use-case level error. Carries the HTTP `statusCode`, a free-form
 * `errors` payload (kept for backwards compatibility — usually the human
 * message), an optional stable machine-readable `code`, and optional per-field
 * `details`. The presentation layer renders these into the contract envelope
 * `{ error: { code, message, details? } }`.
 */
export class UseCaseError {
  public readonly statusCode: number;
  public readonly errors: any;
  public readonly code?: string;
  public readonly details?: ErrorDetail[];

  constructor(errors: any, statusCode?: number, code?: string, details?: ErrorDetail[]) {
    this.errors = errors;
    this.statusCode = statusCode || 500;
    this.code = code;
    this.details = details;
  }
}
