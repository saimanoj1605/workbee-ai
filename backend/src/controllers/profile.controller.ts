import type { AuthRequest } from "../middleware/auth.middleware";
import type { Response, NextFunction } from "express";
import { getProfile, updateProfile } from "../services/profile.service";
import { sendSuccess } from "../utils/response";

export const getProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId as string;
    const profile = await getProfile(userId);
    sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
};

export const updateProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId as string;
    const profile = await updateProfile(userId, req.body);
    sendSuccess(res, profile, 200, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
};
