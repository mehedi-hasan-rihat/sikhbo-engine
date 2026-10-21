import type { Request, Response, NextFunction } from "express";
import type { Role } from "../../generated/prisma/enums.js";
import { ForbiddenError } from "./errorHandler.js";
import { messages } from "../constants/messages.js";

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError(messages.auth.forbidden);
    }
    next();
  };
}
