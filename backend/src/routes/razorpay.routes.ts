import { Router } from "express";

import {
  createOrder,
  verifyPayment,
} from "../controllers/razorpay.controller";
import { protect } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.post("/order", protect, requireRole("BUSINESS"), createOrder);
router.post("/verify", protect, requireRole("BUSINESS"), verifyPayment);

export default router;
