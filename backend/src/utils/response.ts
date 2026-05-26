import type { Response } from "express";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  status = 200,
  message?: string
) => {
  res.status(status).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  status = 400
) => {
  res.status(status).json({
    success: false,
    message,
  });
};
