import type { Role } from "../constants/enums.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
        email: string;
      };
    }
  }
}

export {};
