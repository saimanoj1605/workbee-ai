import type { NextFunction, Response } from "express";
import type { UserRole } from "@prisma/client";

import { AppError } from "../utils/AppError";
import type { AuthRequest } from "./auth.middleware";

export const requireRole =
  (...roles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new AppError("Forbidden: insufficient permissions", 403));
    }
    next();
  };
