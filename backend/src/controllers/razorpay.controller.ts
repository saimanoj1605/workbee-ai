import type { Response } from "express";
import { z } from "zod";

import type { AuthRequest } from "../middleware/auth.middleware";
import * as razorpayService from "../services/razorpay.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

const orderSchema = z.object({
  applicationId: z.string().uuid(),
  amount: z.number().positive(),
});

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export const createOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { applicationId, amount } = orderSchema.parse(req.body);
    const result = await razorpayService.createRazorpayOrder(
      req.userId!,
      applicationId,
      amount
    );
    sendSuccess(res, result, 201, "Razorpay order created");
  }
);

export const verifyPayment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const body = verifySchema.parse(req.body);
    const payment = await razorpayService.verifyRazorpayPayment(
      req.userId!,
      body
    );
    sendSuccess(res, payment, 200, "Payment verified and held");
  }
);
