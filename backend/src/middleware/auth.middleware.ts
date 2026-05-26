import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";

import prisma from "../config/db";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === "string"
        ? authHeader.split(" ")[1]
        : undefined;

    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new AppError("User not found", 401);
    }

    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError("Invalid token", 401));
  }
};
