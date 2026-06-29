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

  static internal(message = "Erro interno do servidor"): AppError {
    return new AppError(message, 500, "internal_error");
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
    default:
      return "internal_error";
  }
}
