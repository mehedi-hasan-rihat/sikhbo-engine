import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, string>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(403, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", errors: Record<string, string>) {
    super(400, message, errors);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
    return;
  }

  // Unexpected error — leak stack in dev, hide in production
  console.error("[error]", err);

  const isDev = env.NODE_ENV === "development";

  res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
    ...(isDev ? { stack: err.stack, detail: err.message } : {}),
  });
}
