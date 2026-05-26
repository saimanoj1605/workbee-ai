import { Router } from "express";

import { syncUser } from "../controllers/clerk.controller";

const router = Router();

router.post("/sync", syncUser);

export default router;
