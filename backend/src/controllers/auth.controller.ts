import type { Response } from "express";

import * as authService from "../services/auth.service";
import { sendSuccess } from "../utils/response";
import type { AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

export const signup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.signup(req.body);
  sendSuccess(res, result, 201, "Account created");
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.login(req.body);
  sendSuccess(res, result, 200, "Login successful");
});
