import type { Request, Response } from "express";
import * as mentorService from "../services/mentor.service.js";
import { messages } from "../constants/messages.js";

const getStr = (v: unknown, fallback: string): string =>
  typeof v === "string" ? v : Array.isArray(v) ? String(v[0]) : fallback;

export async function listSubmissions(
  req: Request,
  res: Response
): Promise<void> {
  const q = req.query;
  const page = parseInt(getStr(q["page"], "1"), 10);
  const pageSize = parseInt(getStr(q["pageSize"], "10"), 10);
  const status = getStr(q["status"], "ALL");
  const search =
    q["search"] !== undefined ? getStr(q["search"], "") || undefined : undefined;

  const result = await mentorService.listSubmissions({
    page,
    pageSize,
    status,
    search,
  });

  res.status(200).json({
    success: true,
    message: messages.submission.listed,
    data: result,
  });
}

export async function getStats(
  _req: Request,
  res: Response
): Promise<void> {
  const stats = await mentorService.getStats();
  res.status(200).json({
    success: true,
    message: "Stats fetched successfully",
    data: stats,
  });
}

export async function updateStatus(
  req: Request,
  res: Response
): Promise<void> {
  const id = req.params["id"] as string;
  const result = await mentorService.updateStatus(id, req.body);
  res.status(200).json({
    success: true,
    message: messages.submission.updated,
    data: result,
  });
}
