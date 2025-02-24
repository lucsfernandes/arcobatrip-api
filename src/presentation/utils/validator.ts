import { Request, Response, NextFunction } from "express";
import { ZodError, ZodObject, ZodSchema } from "zod";

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({
        message: "Validation error",
        errors: error.errors as ZodError['errors']
      });
    }
  }
};