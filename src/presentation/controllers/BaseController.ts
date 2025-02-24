import { Request, Response } from "express";
import { UseCaseError } from "../../application/errors/UseCaseError";
import logger from "../../main/logger";

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

  public ok<T>(res: Response, dto?: T): Response {
    if (dto) {
      res.type("application/json");
      return res.status(200).json({
        success: true,
        ...dto
      });
    } else {
      return res.sendStatus(200);
    }
  }

  public created<T>(res: Response, dto?: T): Response {
    if (dto) {
      res.type("application/json");
      return res.status(201).json({
        success: true,
        ...dto
      });
    } else {
      return res.sendStatus(201);
    }
  }

  public clientError(res: Response, error: UseCaseError | Error | string): Response {
    logger.error(error);
    return res.status(400).json(this.errorToJson(error));
  }

  public fail(res: Response, error: UseCaseError | Error | string): Response {
    logger.error(error);
    if (error instanceof UseCaseError) {
      return res.status(error.statusCode).json(this.errorToJson(error));
    }
    return res.status(500).json(this.errorToJson(error));
  }

  private errorToJson(error: UseCaseError | Error | string) {
    if (error instanceof UseCaseError) {
      return {
        success: false,
        errors: error.errors,
        message: typeof error.errors === "object"
          ? Object.values(error.errors).join(", ")
          : error.errors.toString()
      };
    }
    return {
      success: false,
      message: error.toString()
    };
  }
}
