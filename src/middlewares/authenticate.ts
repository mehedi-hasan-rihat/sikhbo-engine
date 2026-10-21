import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token.js";
import { UnauthorizedError } from "./errorHandler.js";
import { messages } from "../constants/messages.js";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError(messages.auth.unauthorized);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token!);
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError(messages.auth.tokenExpired);
  }
}
