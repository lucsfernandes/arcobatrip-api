import { ErrorDetail, UseCaseError } from "./UseCaseError";

/**
 * Stable, machine-readable error codes shared by the API contract. The
 * frontend narrows on these (`ApiError.code`) so they MUST stay stable.
 */
export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "email_conflict"
  | "conflict"
  | "bad_request"
  | "email_immutable"
  | "invalid_code"
  | "code_expired"
  | "too_many_requests"
  | "too_many_attempts"
  | "gone"
  | "google_not_configured"
  | "google_email_unverified"
  | "account_email_unconfirmed"
  | "internal_error";

/**
 * Convenience {@link UseCaseError} subclass with named constructors for every
 * contract error. Using these keeps the `code`/`statusCode` pairing consistent
 * across use cases.
 */
export class AppError extends UseCaseError {
  constructor(message: string, statusCode: number, code: ErrorCode, details?: ErrorDetail[]) {
    super(message, statusCode, code, details);
  }

  static unauthorized(message = "Não autenticado"): AppError {
    return new AppError(message, 401, "unauthorized");
  }

  static forbidden(message = "Acesso negado"): AppError {
    return new AppError(message, 403, "forbidden");
  }

  static notFound(message = "Recurso não encontrado"): AppError {
    return new AppError(message, 404, "not_found");
  }

  static validation(message = "Falha de validação", details?: ErrorDetail[]): AppError {
    return new AppError(message, 400, "validation_error", details);
  }

  static emailConflict(message = "Este email já está cadastrado"): AppError {
    return new AppError(message, 409, "email_conflict");
  }

  static badRequest(message = "Requisição inválida"): AppError {
    return new AppError(message, 400, "bad_request");
  }

  /** 403 — the email address cannot be changed through the API (support only). */
  static emailImmutable(
    message = "O email não pode ser alterado pela API. Fale com o suporte."
  ): AppError {
    return new AppError(message, 403, "email_immutable");
  }

  /** 400 — a submitted verification code did not match. */
  static invalidCode(message = "Código inválido"): AppError {
    return new AppError(message, 400, "invalid_code");
  }

  /** 410 — the verification code expired or no longer exists. */
  static codeExpired(message = "Código expirado ou inexistente"): AppError {
    return new AppError(message, 410, "code_expired");
  }

  /** 429 — resend attempted before the cooldown window elapsed. */
  static tooManyRequests(
    message = "Aguarde antes de solicitar um novo código"
  ): AppError {
    return new AppError(message, 429, "too_many_requests");
  }

  /** 429 — too many failed validation attempts; the code was invalidated. */
  static tooManyAttempts(
    message = "Muitas tentativas. Solicite um novo código."
  ): AppError {
    return new AppError(message, 429, "too_many_attempts");
  }

  static internal(message = "Erro interno do servidor"): AppError {
    return new AppError(message, 500, "internal_error");
  }

  /**
   * 503 — Google Sign-In is not configured on the server (`GOOGLE_CLIENT_ID`
   * empty). A clear, stable code instead of a crash or a misleading 401.
   */
  static googleNotConfigured(
    message = "Login com Google não está disponível no momento"
  ): AppError {
    return new AppError(message, 503, "google_not_configured");
  }

  /** 401 — the Google account has no e-mail, or Google did not verify it. */
  static googleEmailUnverified(
    message = "A conta Google não possui um e-mail verificado"
  ): AppError {
    return new AppError(message, 401, "google_email_unverified");
  }

  /**
   * 409 — Google sign-in for an e-mail whose account exists but was never
   * confirmed. The account is not taken over and its password is untouched.
   */
  static accountEmailUnconfirmed(
    message = "Já existe uma conta com este e-mail que ainda não foi confirmada. Entre com seu e-mail e senha e confirme o e-mail, ou use \"Esqueci a senha\". Depois disso, você também poderá entrar com o Google."
  ): AppError {
    return new AppError(message, 409, "account_email_unconfirmed");
  }
}

/** Map an HTTP status to a default stable error code when none is provided. */
export function defaultCodeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return "bad_request";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 410:
      return "gone";
    case 429:
      return "too_many_requests";
    default:
      return "internal_error";
  }
}
