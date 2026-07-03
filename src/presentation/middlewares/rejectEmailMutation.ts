import { Request, Response, NextFunction } from "express";

/**
 * Guards `PATCH /users/me`: the email address is immutable via the API (changed
 * only through support). If the body carries an `email` key we reject with 403
 * `email_immutable` — a clearer signal than the strict validator's generic 400
 * for an unknown key. Other unknown keys fall through to the strict Zod schema.
 */
export const rejectEmailMutation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, "email")) {
    res.status(403).json({
      error: {
        code: "email_immutable",
        message: "O email não pode ser alterado pela API. Fale com o suporte.",
      },
    });
    return;
  }
  next();
};
