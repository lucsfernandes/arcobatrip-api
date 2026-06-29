import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";

/**
 * Validate `req.body` against a zod schema. On failure responds 400 with the
 * contract error envelope:
 * `{ error: { code: "validation_error", message, details: [{ path, message }] } }`.
 *
 * On success, the parsed (and coerced) value replaces `req.body` so downstream
 * controllers consume normalized data.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json(zodErrorEnvelope(result.error));
      return;
    }
    req.body = result.data;
    next();
  };
};

/** Build the contract error envelope from a {@link ZodError}. */
export function zodErrorEnvelope(error: ZodError) {
  const details = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  return {
    error: {
      code: "validation_error",
      message: "Falha de validação dos dados enviados",
      details,
    },
  };
}
