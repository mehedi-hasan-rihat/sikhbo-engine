import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createSubmissionSchema } from "../validations/submission.validation.js";
import * as submissionController from "../controllers/submission.controller.js";

export const submissionRouter = Router();

submissionRouter.post(
  "/",
  authenticate,
  authorize("STUDENT"),
  validate(createSubmissionSchema),
  submissionController.createSubmission
);

submissionRouter.get(
  "/",
  authenticate,
  authorize("STUDENT"),
  submissionController.getMySubmissions
);
