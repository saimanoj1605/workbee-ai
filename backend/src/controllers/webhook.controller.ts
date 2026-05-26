import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import {
  handleRazorpayWebhook,
  checkWebhookRateLimit,
  logWebhookEvent,
} from "../services/webhook.service";
import { env } from "../config/env";

/**
 * Razorpay webhook handler
 * Receives payment, payout, and refund events
 */
export const handleRazorpayWebhookController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Get webhook signature from headers
    const webhookSignature = req.get("X-Razorpay-Signature") as string;

    if (!webhookSignature) {
      await logWebhookEvent("unknown", req.body, "failed", "Missing signature");
      res.status(400).json({ error: "Missing webhook signature" });
      return;
    }

    // Rate limiting check
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkWebhookRateLimit(clientIp)) {
      await logWebhookEvent("unknown", req.body, "failed", "Rate limit exceeded");
      res.status(429).json({ error: "Too many requests" });
      return;
    }

    // Get webhook secret from environment
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      await logWebhookEvent("unknown", req.body, "failed", "Webhook secret not configured");
      res.status(500).json({ error: "Webhook not configured" });
      return;
    }

    // Process webhook
    const result = await handleRazorpayWebhook(
      webhookSignature,
      JSON.stringify(req.body),
      webhookSecret
    );

    await logWebhookEvent(
      (req.body as any)?.event || "unknown",
      req.body,
      "success"
    );

    sendSuccess(res, result, 200, "Webhook processed");
  }
);

/**
 * Health check for webhook endpoint
 */
export const webhookHealthCheck = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, { status: "healthy" }, 200, "Webhook endpoint is healthy");
  }
);