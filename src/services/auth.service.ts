import { prisma } from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { signToken } from "../utils/token.js";
import { ConflictError, UnauthorizedError } from "../middlewares/errorHandler.js";
import { messages } from "../constants/messages.js";
import type { RegisterInput, LoginInput } from "../validations/auth.validation.js";

export async function register(data: RegisterInput): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new ConflictError(messages.auth.emailInUse);
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });

  return signToken({ userId: user.id, role: user.role, email: user.email });
}

export async function login(data: LoginInput): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new UnauthorizedError(messages.auth.invalidCredentials);
  }

  const valid = await comparePassword(data.password, user.password);

  if (!valid) {
    throw new UnauthorizedError(messages.auth.invalidCredentials);
  }

  return signToken({ userId: user.id, role: user.role, email: user.email });
}
