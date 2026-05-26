import { Router } from "express";

import { protect } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import * as verificationController from "../controllers/verification.controller";

const router = Router();

// Student Verification Routes
router.post(
  "/students/verify",
  protect,
  requireRole("STUDENT"),
  verificationController.submitStudentVerification
);

router.get(
  "/students/verification-status",
  protect,
  requireRole("STUDENT"),
  verificationController.getStudentVerificationStatus
);

// Business Verification Routes
router.post(
  "/businesses/verify",
  protect,
  requireRole("BUSINESS"),
  verificationController.submitBusinessVerification
);

router.get(
  "/businesses/verification-status",
  protect,
  requireRole("BUSINESS"),
  verificationController.getBusinessVerificationStatus
);

// Admin Verification Routes
router.get(
  "/admin/students/pending",
  protect,
  requireRole("ADMIN"),
  verificationController.getPendingStudentVerifications
);

router.get(
  "/admin/businesses/pending",
  protect,
  requireRole("ADMIN"),
  verificationController.getPendingBusinessVerifications
);

router.post(
  "/admin/students/:studentId/approve",
  protect,
  requireRole("ADMIN"),
  verificationController.approveStudentVerification
);

router.post(
  "/admin/students/:studentId/reject",
  protect,
  requireRole("ADMIN"),
  verificationController.rejectStudentVerification
);

router.post(
  "/admin/businesses/:businessId/approve",
  protect,
  requireRole("ADMIN"),
  verificationController.approveBusinessVerification
);

router.post(
  "/admin/businesses/:businessId/reject",
  protect,
  requireRole("ADMIN"),
  verificationController.rejectBusinessVerification
);

router.get(
  "/admin/stats",
  protect,
  requireRole("ADMIN"),
  verificationController.getVerificationStats
);

export default router;