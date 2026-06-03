import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import { getDashboard } from "../services/dashboard.service";
import { sendSuccess } from "../utils/response";

export const getDashboardController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId as string;
    const dashboard = await getDashboard(userId);
    sendSuccess(res, dashboard);
  } catch (error) {
    next(error);
  }
};
