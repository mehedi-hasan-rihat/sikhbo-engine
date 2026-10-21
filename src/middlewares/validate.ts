import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ValidationError } from "./errorHandler.js";
import { messages } from "../constants/messages.js";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join(".");
        errors[field] = issue.message;
      }
      throw new ValidationError(messages.validation.failed, errors);
    }

    req.body = result.data;
    next();
  };
}
