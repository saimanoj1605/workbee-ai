import { Router } from "express";
import { getDashboardController } from "../controllers/dashboard.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);
router.get("/", getDashboardController);

export default router;
