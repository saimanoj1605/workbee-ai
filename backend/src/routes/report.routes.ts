import { Router } from "express";

import { protect } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import * as reportController from "../controllers/report.controller";

const router = Router();

// User Report Routes
router.post(
  "/",
  protect,
  reportController.createReport
);

router.get(
  "/my-reports",
  protect,
  reportController.getUserReports
);

router.get(
  "/:reportId",
  protect,
  reportController.getReport
);

// Admin Report Routes
router.get(
  "/admin/all",
  protect,
  requireRole("ADMIN"),
  reportController.getAllReports
);

router.get(
  "/admin/pending",
  protect,
  requireRole("ADMIN"),
  reportController.getPendingReports
);

router.post(
  "/admin/:reportId/assign",
  protect,
  requireRole("ADMIN"),
  reportController.assignReport
);

router.post(
  "/admin/:reportId/resolve",
  protect,
  requireRole("ADMIN"),
  reportController.resolveReport
);

router.post(
  "/admin/:reportId/dismiss",
  protect,
  requireRole("ADMIN"),
  reportController.dismissReport
);

router.post(
  "/admin/:reportId/escalate",
  protect,
  requireRole("ADMIN"),
  reportController.escalateReport
);

router.get(
  "/admin/stats",
  protect,
  requireRole("ADMIN"),
  reportController.getReportStats
);

export default router;