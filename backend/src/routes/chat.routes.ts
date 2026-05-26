import { Router } from "express";

import { getMessages } from "../controllers/chat.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/messages", protect, getMessages);

export default router;

