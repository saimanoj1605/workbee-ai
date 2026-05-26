import type { Response } from "express";

import type { AuthRequest } from "../middleware/auth.middleware";
import * as aiService from "../services/ai.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const matchWorkers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const result = await aiService.getMatchedWorkers(
      String(req.params.gigId),
      limit
    );
    sendSuccess(res, result);
  }
);

export const nearbyGigs = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = req.query.radius ? Number(req.query.radius) : 25;
    const gigs = await aiService.getNearbyGigs(lat, lng, radius);
    sendSuccess(res, { gigs });
  }
);

export const careerAssistant = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await aiService.getCareerAssistant(req.userId!);
    sendSuccess(res, result);
  }
);

export const fraudCheck = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.params.userId
      ? String(req.params.userId)
      : req.userId!;
    const result = await aiService.checkUserFraud(userId);
    sendSuccess(res, result);
  }
);

export const workIdentity = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const rep = await aiService.getWorkIdentity(req.userId!);
    sendSuccess(res, rep);
  }
);
