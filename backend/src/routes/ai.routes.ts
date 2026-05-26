import { Router } from "express";

import {
  careerAssistant,
  fraudCheck,
  matchWorkers,
  nearbyGigs,
  workIdentity,
} from "../controllers/ai.controller";
import { protect } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get("/match/:gigId", protect, requireRole("BUSINESS"), matchWorkers);
router.get("/nearby", nearbyGigs);
router.get("/career", protect, requireRole("STUDENT"), careerAssistant);
router.get("/identity", protect, workIdentity);
router.get("/fraud", protect, fraudCheck);
router.get("/fraud/:userId", protect, fraudCheck);

export default router;
