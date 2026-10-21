import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { submissionRouter } from "./submission.routes.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/submissions", submissionRouter);
