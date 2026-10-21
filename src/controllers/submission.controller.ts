import type { Request, Response } from "express";
import * as submissionService from "../services/submission.service.js";
import { messages } from "../constants/messages.js";

export async function createSubmission(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const submission = await submissionService.createSubmission(userId, req.body);
  res.status(201).json({
    success: true,
    message: messages.submission.created,
    data: submission,
  });
}

export async function getMySubmissions(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const submissions = await submissionService.getMySubmissions(userId);
  res.status(200).json({
    success: true,
    message: messages.submission.listed,
    data: submissions,
  });
}
