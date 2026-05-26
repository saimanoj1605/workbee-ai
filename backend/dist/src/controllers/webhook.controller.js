"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookHealthCheck = exports.handleRazorpayWebhookController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const webhook_service_1 = require("../services/webhook.service");
const env_1 = require("../config/env");
/**
 * Razorpay webhook handler
 * Receives payment, payout, and refund events
 */
exports.handleRazorpayWebhookController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Get webhook signature from headers
    const webhookSignature = req.get("X-Razorpay-Signature");
    if (!webhookSignature) {
        await (0, webhook_service_1.logWebhookEvent)("unknown", req.body, "failed", "Missing signature");
        res.status(400).json({ error: "Missing webhook signature" });
        return;
    }
    // Rate limiting check
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!(0, webhook_service_1.checkWebhookRateLimit)(clientIp)) {
        await (0, webhook_service_1.logWebhookEvent)("unknown", req.body, "failed", "Rate limit exceeded");
        res.status(429).json({ error: "Too many requests" });
        return;
    }
    // Get webhook secret from environment
    const webhookSecret = env_1.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        await (0, webhook_service_1.logWebhookEvent)("unknown", req.body, "failed", "Webhook secret not configured");
        res.status(500).json({ error: "Webhook not configured" });
        return;
    }
    // Process webhook
    const result = await (0, webhook_service_1.handleRazorpayWebhook)(webhookSignature, JSON.stringify(req.body), webhookSecret);
    await (0, webhook_service_1.logWebhookEvent)(req.body?.event || "unknown", req.body, "success");
    (0, response_1.sendSuccess)(res, result, 200, "Webhook processed");
});
/**
 * Health check for webhook endpoint
 */
exports.webhookHealthCheck = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    (0, response_1.sendSuccess)(res, { status: "healthy" }, 200, "Webhook endpoint is healthy");
});
