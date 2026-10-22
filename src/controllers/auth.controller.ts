import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { messages } from "../constants/messages.js";

export async function register(req: Request, res: Response): Promise<void> {
  const token = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: messages.auth.registered,
    data: { token },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const token = await authService.login(req.body);
  res.status(200).json({
    success: true,
    message: messages.auth.loggedIn,
    data: { token },
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // JWT is stateless — logout is handled client-side by discarding the token.
  // This endpoint exists as a convenience for clients that need a logout call.
  res.status(200).json({
    success: true,
    message: messages.auth.loggedOut,
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(req.user!.userId);
  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: user,
  });
}
