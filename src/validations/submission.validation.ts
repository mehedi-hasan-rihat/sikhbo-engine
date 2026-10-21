import { z } from "zod";

export const createSubmissionSchema = z.object({
  projectName: z
    .string()
    .min(3, "Project name must be at least 3 characters")
    .max(100, "Project name must be at most 100 characters"),
  repoUrl: z
    .url("Invalid URL format")
    .refine((url) => new URL(url).hostname === "github.com", {
      message: "Repo URL must be a github.com URL",
    }),
  liveUrl: z.url("Invalid URL format").optional(),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must be at most 500 characters"),
});

export const updateStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    error: "Status must be APPROVED or REJECTED",
  }),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
