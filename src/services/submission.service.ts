import { prisma } from "../config/prisma.js";
import { ConflictError, NotFoundError } from "../middlewares/errorHandler.js";
import { messages } from "../constants/messages.js";
import type { CreateSubmissionInput } from "../validations/submission.validation.js";

const submissionSelect = {
  id: true,
  projectName: true,
  repoUrl: true,
  liveUrl: true,
  description: true,
  status: true,
  createdAt: true,
} as const;

export async function createSubmission(
  userId: string,
  data: CreateSubmissionInput
) {
  const existing = await prisma.submission.findFirst({
    where: { studentId: userId, repoUrl: data.repoUrl },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError(messages.submission.duplicate);
  }

  return prisma.submission.create({
    data: {
      projectName: data.projectName,
      repoUrl: data.repoUrl,
      liveUrl: data.liveUrl,
      description: data.description,
      studentId: userId,
    },
    select: submissionSelect,
  });
}

export async function getMySubmissions(userId: string) {
  const submissions = await prisma.submission.findMany({
    where: { studentId: userId },
    select: submissionSelect,
    orderBy: { createdAt: "desc" },
  });

  if (submissions.length === 0) {
    throw new NotFoundError(messages.submission.noSubmission);
  }

  return submissions;
}
