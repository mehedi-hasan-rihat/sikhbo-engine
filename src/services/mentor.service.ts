import { prisma } from "../config/prisma.js";
import { NotFoundError } from "../middlewares/errorHandler.js";
import { messages } from "../constants/messages.js";
import type { UpdateStatusInput } from "../validations/submission.validation.js";

export async function listSubmissions(params: {
  page: number;
  pageSize: number;
  status: string;
  search?: string;
}) {
  const { page, pageSize, status, search } = params;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(status !== "ALL"
      ? { status: status as "PENDING" | "APPROVED" | "REJECTED" }
      : {}),
    ...(search
      ? { projectName: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [submissions, total] = await prisma.$transaction([
    prisma.submission.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        projectName: true,
        repoUrl: true,
        liveUrl: true,
        description: true,
        status: true,
        createdAt: true,
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    submissions,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getStats() {
  const groups = await prisma.submission.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const stats = { total: 0, pending: 0, approved: 0, rejected: 0 };

  for (const group of groups) {
    const count = group._count.status;
    stats.total += count;
    if (group.status === "PENDING") stats.pending = count;
    if (group.status === "APPROVED") stats.approved = count;
    if (group.status === "REJECTED") stats.rejected = count;
  }

  return stats;
}

export async function updateStatus(id: string, data: UpdateStatusInput) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!submission) {
    throw new NotFoundError(messages.submission.notFound);
  }

  return prisma.submission.update({
    where: { id },
    data: { status: data.status },
    select: {
      id: true,
      status: true,
      updatedAt: true,
    },
  });
}
