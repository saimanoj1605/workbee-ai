import { Router } from "express";

import {
  applyToGig,
  emergencyDispatch,
  createGig,
  getGigs,
  updateApplication,
  updateWorkerPhase,
  verifyWork,
} from "../controllers/gig.controller";
import { protect } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get("/", getGigs);
router.post("/", protect, requireRole("BUSINESS"), createGig);
router.post("/:gigId/apply", protect, requireRole("STUDENT"), applyToGig);
router.post(
  "/:gigId/emergency",
  protect,
  requireRole("BUSINESS"),
  emergencyDispatch
);
router.patch(
  "/:gigId/applications/:applicationId",
  protect,
  requireRole("BUSINESS"),
  updateApplication
);
router.patch(
  "/:gigId/applications/:applicationId/phase",
  protect,
  requireRole("STUDENT", "BUSINESS"),
  updateWorkerPhase
);

router.post(
  "/:gigId/applications/:applicationId/verify",
  protect,
  requireRole("STUDENT"),
  verifyWork
);

export default router;
