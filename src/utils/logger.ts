import type { Request, Response, NextFunction } from "express";

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
};

function colorizeMethod(method: string): string {
  switch (method) {
    case "GET":
      return `${colors.cyan}${method}${colors.reset}`;
    case "POST":
      return `${colors.green}${method}${colors.reset}`;
    case "PATCH":
    case "PUT":
      return `${colors.yellow}${method}${colors.reset}`;
    case "DELETE":
      return `${colors.red}${method}${colors.reset}`;
    default:
      return `${colors.white}${method}${colors.reset}`;
  }
}

function colorizeStatus(status: number): string {
  if (status >= 500) return `${colors.red}${status}${colors.reset}`;
  if (status >= 400) return `${colors.yellow}${status}${colors.reset}`;
  if (status >= 300) return `${colors.magenta}${status}${colors.reset}`;
  return `${colors.green}${status}${colors.reset}`;
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

    console.log(
      `${colors.dim}${timestamp}${colors.reset}  ` +
        `${colorizeMethod(req.method.padEnd(6))}  ` +
        `${colorizeStatus(res.statusCode)}  ` +
        `${colors.white}${req.originalUrl}${colors.reset}  ` +
        `${colors.dim}${duration}ms${colors.reset}`
    );
  });

  next();
}
