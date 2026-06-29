import { Request, Response } from "express";
import { UseCaseError } from "../../application/errors/UseCaseError";
import { defaultCodeForStatus } from "../../application/errors/AppError";
import logger from "../../main/logger";

/**
 * Contract error envelope: every non-2xx response is exactly
 * `{ error: { code, message, details? } }`.
 */
export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
}

export abstract class BaseController {
  protected abstract executeImpl(req: Request, res: Response): Promise<Response>;

  public async execute(req: Request, res: Response): Promise<Response> {
    try {
      return await this.executeImpl(req, res);
    } catch (err) {
      logger.error("[BaseController]: Uncaught controller error", err);
      return this.fail(res, (err as Error).message || "An unexpected error occurred");
    }
  }

  public static jsonResponse(res: Response, code: number, message: string): Response {
    return res.status(code).json({ message });
  }

  /** 200 with the RAW contract body (no wrapping). */
  public ok<T>(res: Response, dto?: T): Response {
    if (dto !== undefined) {
      res.type("application/json");
      return res.status(200).json(dto);
    }
    return res.sendStatus(200);
  }

  /** 201 with the RAW contract body (no wrapping). */
  public created<T>(res: Response, dto?: T): Response {
    if (dto !== undefined) {
      res.type("application/json");
      return res.status(201).json(dto);
    }
    return res.sendStatus(201);
  }

  /** 400 with the contract error envelope. */
  public clientError(res: Response, error: UseCaseError | Error | string): Response {
    logger.error(error);
    const status = error instanceof UseCaseError ? error.statusCode : 400;
    return res.status(status).json(this.errorToJson(error, status));
  }

  /** Generic failure — honors UseCaseError.statusCode, otherwise 500. */
  public fail(res: Response, error: UseCaseError | Error | string): Response {
    logger.error(error);
    const status = error instanceof UseCaseError ? error.statusCode : 500;
    return res.status(status).json(this.errorToJson(error, status));
  }

  private errorToJson(error: UseCaseError | Error | string, status: number): ErrorEnvelope {
    if (error instanceof UseCaseError) {
      const message =
        typeof error.errors === "object" && error.errors !== null
          ? Object.values(error.errors).join(", ")
          : String(error.errors);
      const envelope: ErrorEnvelope = {
        error: {
          code: error.code ?? defaultCodeForStatus(status),
          message,
        },
      };
      if (error.details && error.details.length > 0) {
        envelope.error.details = error.details;
      }
      return envelope;
    }

    const message = typeof error === "string" ? error : error.message;
    return {
      error: {
        code: defaultCodeForStatus(status),
        message,
      },
    };
  }
}
