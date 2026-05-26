import type { Response } from "express";
import { z } from "zod";

import type { AuthRequest } from "../middleware/auth.middleware";
import * as clerkService from "../services/clerk.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

const syncSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(["STUDENT", "BUSINESS", "ADMIN"]),
  businessName: z.string().optional(),
});

export const syncUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = syncSchema.parse(req.body);
  const result = await clerkService.syncClerkUser(data);
  sendSuccess(res, result, result.isNew ? 201 : 200, "User synced");
});
