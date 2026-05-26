import type { Response } from "express";

import * as verificationService from "../services/verification.service";
import { sendSuccess } from "../utils/response";
import type { AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

// ============================================
// STUDENT VERIFICATION
// ============================================

export const submitStudentVerification = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await verificationService.createStudentVerification({
      studentId: req.userId!,
      ...req.body,
    });
    sendSuccess(res, result, 201, "Student verification submitted");
  }
);

export const getStudentVerificationStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await verificationService.getStudentVerification(req.userId!);
    sendSuccess(res, result, 200, "Student verification status retrieved");
  }
);

// ============================================
// BUSINESS VERIFICATION
// ============================================

export const submitBusinessVerification = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await verificationService.createBusinessVerification({
      businessId: req.userId!,
      ...req.body,
    });
    sendSuccess(res, result, 201, "Business verification submitted");
  }
);

export const getBusinessVerificationStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await verificationService.getBusinessVerification(req.userId!);
    sendSuccess(res, result, 200, "Business verification status retrieved");
  }
);

// ============================================
// ADMIN: STUDENT VERIFICATIONS
// ============================================

export const getPendingStudentVerifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await verificationService.getPendingStudentVerifications();
    sendSuccess(res, result, 200, "Pending student verifications retrieved");
  }
);

export const approveStudentVerification = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
    const result = await verificationService.verifyStudent(
      studentId,
      req.userId!,
      req.body.metadata
    );
    sendSuccess(res, result, 200, "Student verification approved");
  }
);

export const rejectStudentVerification = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
    const { reason } = req.body;
    const result = await verificationService.rejectStudentVerification(
      studentId,
      req.userId!,
      reason
    );
    sendSuccess(res, result, 200, "Student verification rejected");
  }
);

// ============================================
// ADMIN: BUSINESS VERIFICATIONS
// ============================================

export const getPendingBusinessVerifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await verificationService.getPendingBusinessVerifications();
    sendSuccess(res, result, 200, "Pending business verifications retrieved");
  }
);

export const approveBusinessVerification = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const result = await verificationService.verifyBusiness(
      businessId,
      req.userId!,
      req.body.metadata
    );
    sendSuccess(res, result, 200, "Business verification approved");
  }
);

export const rejectBusinessVerification = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const { reason } = req.body;
    const result = await verificationService.rejectBusinessVerification(
      businessId,
      req.userId!,
      reason
    );
    sendSuccess(res, result, 200, "Business verification rejected");
  }
);

// ============================================
// ADMIN: VERIFICATION STATISTICS
// ============================================

export const getVerificationStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await verificationService.getVerificationStats();
    sendSuccess(res, result, 200, "Verification statistics retrieved");
  }
);