import { Router } from "express";

import {
  confirmPayment,
  createPayment,
  releasePayment,
} from "../controllers/payment.controller";
import { protect } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/create",
  protect,
  requireRole("BUSINESS"),
  createPayment
);
router.post(
  "/confirm",
  protect,
  requireRole("BUSINESS"),
  confirmPayment
);
router.post(
  "/release",
  protect,
  requireRole("BUSINESS"),
  releasePayment
);

export default router;
