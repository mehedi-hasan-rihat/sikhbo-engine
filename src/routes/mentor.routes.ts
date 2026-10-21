import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { updateStatusSchema } from "../validations/submission.validation.js";
import * as mentorController from "../controllers/mentor.controller.js";

export const mentorRouter = Router();

mentorRouter.use(authenticate, authorize("MENTOR"));

mentorRouter.get("/submissions", mentorController.listSubmissions);
mentorRouter.get("/submissions/stats", mentorController.getStats);
mentorRouter.patch(
  "/submissions/:id/status",
  validate(updateStatusSchema),
  mentorController.updateStatus
);
