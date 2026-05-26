import type { Response } from "express";

import type { AuthRequest } from "../middleware/auth.middleware";
import * as paymentService from "../services/payment.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const createPayment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await paymentService.createPayment(req.userId!, req.body);
    sendSuccess(res, result, 201, "Payment intent created");
  }
);

export const confirmPayment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { paymentIntentId } = req.body as { paymentIntentId: string };
    const payment = await paymentService.confirmPaymentHeld(
      req.userId!,
      paymentIntentId
    );
    sendSuccess(res, payment, 200, "Payment held in escrow");
  }
);

export const releasePayment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const payment = await paymentService.releasePayment(req.userId!, req.body);
    sendSuccess(res, payment, 200, "Payment released");
  }
);
