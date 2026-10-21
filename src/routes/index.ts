import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { submissionRouter } from "./submission.routes.js";
import { mentorRouter } from "./mentor.routes.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/submissions", submissionRouter);
router.use("/mentor", mentorRouter);
