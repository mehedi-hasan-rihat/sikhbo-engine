import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import * as authController from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", authLimiter, validate(registerSchema), authController.register);
authRouter.post("/login", authLimiter, validate(loginSchema), authController.login);
