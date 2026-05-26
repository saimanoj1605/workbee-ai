import type { Response } from "express";

import * as reportService from "../services/report.service";
import { sendSuccess } from "../utils/response";
import type { AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

// ============================================
// USER REPORT ACTIONS
// ============================================

export const createReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await reportService.createReport({
    ...req.body,
    reporterId: req.userId!,
  });
  sendSuccess(res, result, 201, "Report submitted successfully");
});

export const getUserReports = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await reportService.getUserReports(req.userId!);
  sendSuccess(res, result, 200, "Reports retrieved successfully");
});

export const getReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
  const result = await reportService.getReport(reportId);
  sendSuccess(res, result, 200, "Report retrieved successfully");
});

// ============================================
// ADMIN REPORT ACTIONS
// ============================================

export const getAllReports = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, type, limit = 50, offset = 0 } = req.query;
  const result = await reportService.getAllReports(
    status as any,
    type as any,
    Number(limit),
    Number(offset)
  );
  sendSuccess(res, result, 200, "Reports retrieved successfully");
});

export const getPendingReports = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await reportService.getPendingReports();
  sendSuccess(res, result, 200, "Pending reports retrieved successfully");
});

export const assignReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
  const result = await reportService.assignReport(reportId, req.userId!);
  sendSuccess(res, result, 200, "Report assigned successfully");
});

export const resolveReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
  const { resolutionNotes, action } = req.body;
  const result = await reportService.resolveReport(reportId, req.userId!, resolutionNotes, action);
  sendSuccess(res, result, 200, "Report resolved successfully");
});

export const dismissReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
  const { reason } = req.body;
  const result = await reportService.dismissReport(reportId, req.userId!, reason);
  sendSuccess(res, result, 200, "Report dismissed successfully");
});

export const escalateReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
  const { reason } = req.body;
  const result = await reportService.escalateReport(reportId, req.userId!, reason);
  sendSuccess(res, result, 200, "Report escalated successfully");
});

export const getReportStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await reportService.getReportStats();
  sendSuccess(res, result, 200, "Report statistics retrieved successfully");
});