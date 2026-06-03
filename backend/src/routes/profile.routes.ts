import { Router } from "express";
import {
  getProfileController,
  updateProfileController,
} from "../controllers/profile.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);
router.get("/", getProfileController);
router.put("/", updateProfileController);

export default router;
