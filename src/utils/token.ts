import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Role } from "../constants/enums.js";

export interface TokenPayload {
  userId: string;
  role: Role;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
