import type { Response } from "express";

import type { AuthRequest } from "../middleware/auth.middleware";
import * as reviewService from "../services/review.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const createReview = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const review = await reviewService.createReview(req.userId!, req.body);
    sendSuccess(res, review, 201, "Review submitted");
  }
);
