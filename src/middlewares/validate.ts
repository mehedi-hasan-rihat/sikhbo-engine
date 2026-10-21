import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "./errorHandler.js";
import { messages } from "../constants/messages.js";

export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") || "body";
        errors[field] = issue.message;
      }
      throw new ValidationError(messages.validation.failed, errors);
    }

    req.body = result.data;
    next();
  };
}
