import { Router } from "express";
import multer from "multer";

import { uploadFile } from "../controllers/upload.controller";
import { protect } from "../middleware/auth.middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.post("/", protect, upload.single("file"), uploadFile);

export default router;
