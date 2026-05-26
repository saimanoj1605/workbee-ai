"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWebhookEvent = exports.checkWebhookRateLimit = exports.handleRazorpayWebhook = exports.handleRefundWebhookEvent = exports.handlePayoutWebhookEvent = exports.handlePaymentWebhook = exports.verifyWebhookSignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../config/db"));
const AppError_1 = require("../utils/AppError");
const escrow_service_1 = require("./escrow.service");
const payout_service_1 = require("./payout.service");
const refund_service_1 = require("./refund.service");
// ============================================
// WEBHOOK VERIFICATION & HANDLING
// Secure webhook processing for Razorpay events
// ============================================
/**
 * Verify Razorpay webhook signature
 * Critical security step to prevent fake callbacks
 */
const verifyWebhookSignature = (webhookSignature, webhookBody, webhookSecret) => {
    const expectedSignature = crypto_1.default
        .createHmac("sha256", webhookSecret)
        .update(webhookBody)
        .digest("hex");
    return crypto_1.default.timingSafeEqual(Buffer.from(webhookSignature, "utf8"), Buffer.from(expectedSignature, "utf8"));
};
exports.verifyWebhookSignature = verifyWebhookSignature;
/**
 * Process Razorpay payment webhook events
 */
const handlePaymentWebhook = async (event) => {
    const { event: eventType, payload } = event;
    switch (eventType) {
        case "payment.captured": {
            const paymentEntity = payload.payment?.entity;
            if (!paymentEntity) {
                throw new AppError_1.AppError("Invalid payment webhook payload", 400);
            }
            // Find the payment record by Razorpay order ID
            const payment = await db_1.default.payment.findFirst({
                where: {
                    razorpayOrderId: paymentEntity.order_id,
                },
                include: {
                    application: {
                        include: {
                            student: { include: { user: true } },
                            gig: true,
                        },
                    },
                },
            });
            if (!payment) {
                // Payment record might not exist if order wasn't created through our system
                console.log("Payment record not found for webhook:", paymentEntity.order_id);
                return { status: "ok" };
            }
            // Hold payment in escrow
            await (0, escrow_service_1.holdPaymentInEscrow)(payment.id, paymentEntity.id, "" // Signature will be verified at webhook level
            );
            return { status: "ok" };
        }
        case "payment.failed": {
            const paymentEntity = payload.payment?.entity;
            if (!paymentEntity) {
                throw new AppError_1.AppError("Invalid payment failed webhook payload", 400);
            }
            // Update payment status to failed
            await db_1.default.payment.updateMany({
                where: {
                    razorpayOrderId: paymentEntity.order_id,
                },
                data: {
                    status: "FAILED",
                    metadata: {
                        failureReason: "Payment failed",
                        razorpayPaymentId: paymentEntity.id,
                    },
                },
            });
            return { status: "ok" };
        }
        case "order.paid": {
            const orderEntity = payload.order?.entity;
            if (!orderEntity) {
                throw new AppError_1.AppError("Invalid order webhook payload", 400);
            }
            // Payment is already handled by payment.captured event
            return { status: "ok" };
        }
        default:
            console.log("Unhandled webhook event:", eventType);
            return { status: "ok" };
    }
};
exports.handlePaymentWebhook = handlePaymentWebhook;
/**
 * Process Razorpay payout webhook events
 */
const handlePayoutWebhookEvent = async (event) => {
    const { event: eventType, payload } = event;
    if (eventType === "transfer.processed") {
        const transferEntity = payload.transfer?.entity;
        if (!transferEntity) {
            throw new AppError_1.AppError("Invalid transfer webhook payload", 400);
        }
        await (0, payout_service_1.handlePayoutWebhook)(transferEntity.id, "processed", transferEntity.id);
    }
    else if (eventType === "transfer.failed" || eventType === "transfer.rejected") {
        const transferEntity = payload.transfer?.entity;
        if (!transferEntity) {
            throw new AppError_1.AppError("Invalid transfer webhook payload", 400);
        }
        await (0, payout_service_1.handlePayoutWebhook)(transferEntity.id, eventType === "transfer.failed" ? "failed" : "rejected", transferEntity.id);
    }
    return { status: "ok" };
};
exports.handlePayoutWebhookEvent = handlePayoutWebhookEvent;
/**
 * Process Razorpay refund webhook events
 */
const handleRefundWebhookEvent = async (event) => {
    const { event: eventType, payload } = event;
    if (eventType === "refund.processed") {
        const refundEntity = payload.refund?.entity;
        if (!refundEntity) {
            throw new AppError_1.AppError("Invalid refund webhook payload", 400);
        }
        await (0, refund_service_1.handleRefundWebhook)(refundEntity.id, "processed");
    }
    else if (eventType === "refund.failed") {
        const refundEntity = payload.refund?.entity;
        if (!refundEntity) {
            throw new AppError_1.AppError("Invalid refund webhook payload", 400);
        }
        await (0, refund_service_1.handleRefundWebhook)(refundEntity.id, "failed");
    }
    return { status: "ok" };
};
exports.handleRefundWebhookEvent = handleRefundWebhookEvent;
/**
 * Main webhook handler - routes to appropriate handler
 */
const handleRazorpayWebhook = async (webhookSignature, webhookBody, webhookSecret) => {
    // Verify webhook signature
    if (!(0, exports.verifyWebhookSignature)(webhookSignature, webhookBody, webhookSecret)) {
        throw new AppError_1.AppError("Invalid webhook signature", 401);
    }
    // Parse webhook body
    let event;
    try {
        event = JSON.parse(webhookBody);
    }
    catch (error) {
        throw new AppError_1.AppError("Invalid webhook body", 400);
    }
    // Route to appropriate handler
    if (event.event?.includes("payment") || event.event?.includes("order")) {
        return (0, exports.handlePaymentWebhook)(event);
    }
    else if (event.event?.includes("transfer")) {
        return (0, exports.handlePayoutWebhookEvent)(event);
    }
    else if (event.event?.includes("refund")) {
        return (0, exports.handleRefundWebhookEvent)(event);
    }
    console.log("Unhandled webhook event type:", event.event);
    return { status: "ok" };
};
exports.handleRazorpayWebhook = handleRazorpayWebhook;
/**
 * Rate limiting for webhook endpoints
 * Prevents webhook spam attacks
 */
const webhookRateLimits = new Map();
const checkWebhookRateLimit = (ip) => {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 100;
    const limit = webhookRateLimits.get(ip);
    if (!limit || now > limit.resetTime) {
        webhookRateLimits.set(ip, {
            count: 1,
            resetTime: now + windowMs,
        });
        return true;
    }
    if (limit.count >= maxRequests) {
        return false;
    }
    limit.count++;
    return true;
};
exports.checkWebhookRateLimit = checkWebhookRateLimit;
/**
 * Log webhook events for audit trail
 */
const logWebhookEvent = async (eventType, payload, status, error) => {
    await db_1.default.notification.create({
        data: {
            userId: "system",
            title: `Webhook: ${eventType}`,
            message: status === "success" ? "Processed successfully" : `Failed: ${error}`,
            type: "SYSTEM",
            metadata: {
                eventType,
                payload: JSON.stringify(payload).substring(0, 1000), // Truncate for storage
                status,
                timestamp: new Date().toISOString(),
            },
        },
    });
};
exports.logWebhookEvent = logWebhookEvent;
