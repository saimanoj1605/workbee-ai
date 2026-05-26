import crypto from "crypto";
import prisma from "../config/db";
import { env } from "../config/env";
import { getIO } from "../config/socket";
import { AppError } from "../utils/AppError";
import { holdPaymentInEscrow } from "./escrow.service";
import { handlePayoutWebhook } from "./payout.service";
import { handleRefundWebhook } from "./refund.service";

// ============================================
// WEBHOOK VERIFICATION & HANDLING
// Secure webhook processing for Razorpay events
// ============================================

/**
 * Verify Razorpay webhook signature
 * Critical security step to prevent fake callbacks
 */
export const verifyWebhookSignature = (
  webhookSignature: string,
  webhookBody: string,
  webhookSecret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(webhookBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(webhookSignature, "utf8"),
    Buffer.from(expectedSignature, "utf8")
  );
};

/**
 * Process Razorpay payment webhook events
 */
export const handlePaymentWebhook = async (
  event: {
    event: string;
    payload: {
      payment?: {
        entity: {
          id: string;
          order_id: string;
          status: string;
          amount: number;
          currency: string;
        };
      };
      order?: {
        entity: {
          id: string;
          status: string;
        };
      };
    };
  }
) => {
  const { event: eventType, payload } = event;

  switch (eventType) {
    case "payment.captured": {
      const paymentEntity = payload.payment?.entity;
      if (!paymentEntity) {
        throw new AppError("Invalid payment webhook payload", 400);
      }

      // Find the payment record by Razorpay order ID
      const payment = await prisma.payment.findFirst({
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
      await holdPaymentInEscrow(
        payment.id,
        paymentEntity.id,
        "" // Signature will be verified at webhook level
      );

      return { status: "ok" };
    }

    case "payment.failed": {
      const paymentEntity = payload.payment?.entity;
      if (!paymentEntity) {
        throw new AppError("Invalid payment failed webhook payload", 400);
      }

      // Update payment status to failed
      await prisma.payment.updateMany({
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
        throw new AppError("Invalid order webhook payload", 400);
      }

      // Payment is already handled by payment.captured event
      return { status: "ok" };
    }

    default:
      console.log("Unhandled webhook event:", eventType);
      return { status: "ok" };
  }
};

/**
 * Process Razorpay payout webhook events
 */
export const handlePayoutWebhookEvent = async (
  event: {
    event: string;
    payload: {
      transfer?: {
        entity: {
          id: string;
          status: string;
          amount: number;
        };
      };
    };
  }
) => {
  const { event: eventType, payload } = event;

  if (eventType === "transfer.processed") {
    const transferEntity = payload.transfer?.entity;
    if (!transferEntity) {
      throw new AppError("Invalid transfer webhook payload", 400);
    }

    await handlePayoutWebhook(
      transferEntity.id,
      "processed",
      transferEntity.id
    );
  } else if (eventType === "transfer.failed" || eventType === "transfer.rejected") {
    const transferEntity = payload.transfer?.entity;
    if (!transferEntity) {
      throw new AppError("Invalid transfer webhook payload", 400);
    }

    await handlePayoutWebhook(
      transferEntity.id,
      eventType === "transfer.failed" ? "failed" : "rejected",
      transferEntity.id
    );
  }

  return { status: "ok" };
};

/**
 * Process Razorpay refund webhook events
 */
export const handleRefundWebhookEvent = async (
  event: {
    event: string;
    payload: {
      refund?: {
        entity: {
          id: string;
          status: string;
        };
      };
    };
  }
) => {
  const { event: eventType, payload } = event;

  if (eventType === "refund.processed") {
    const refundEntity = payload.refund?.entity;
    if (!refundEntity) {
      throw new AppError("Invalid refund webhook payload", 400);
    }

    await handleRefundWebhook(refundEntity.id, "processed");
  } else if (eventType === "refund.failed") {
    const refundEntity = payload.refund?.entity;
    if (!refundEntity) {
      throw new AppError("Invalid refund webhook payload", 400);
    }

    await handleRefundWebhook(refundEntity.id, "failed");
  }

  return { status: "ok" };
};

/**
 * Main webhook handler - routes to appropriate handler
 */
export const handleRazorpayWebhook = async (
  webhookSignature: string,
  webhookBody: string,
  webhookSecret: string
) => {
  // Verify webhook signature
  if (!verifyWebhookSignature(webhookSignature, webhookBody, webhookSecret)) {
    throw new AppError("Invalid webhook signature", 401);
  }

  // Parse webhook body
  let event;
  try {
    event = JSON.parse(webhookBody);
  } catch (error) {
    throw new AppError("Invalid webhook body", 400);
  }

  // Route to appropriate handler
  if (event.event?.includes("payment") || event.event?.includes("order")) {
    return handlePaymentWebhook(event);
  } else if (event.event?.includes("transfer")) {
    return handlePayoutWebhookEvent(event);
  } else if (event.event?.includes("refund")) {
    return handleRefundWebhookEvent(event);
  }

  console.log("Unhandled webhook event type:", event.event);
  return { status: "ok" };
};

/**
 * Rate limiting for webhook endpoints
 * Prevents webhook spam attacks
 */
const webhookRateLimits = new Map<string, { count: number; resetTime: number }>();

export const checkWebhookRateLimit = (ip: string): boolean => {
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

/**
 * Log webhook events for audit trail
 */
export const logWebhookEvent = async (
  eventType: string,
  payload: any,
  status: "success" | "failed",
  error?: string
) => {
  await prisma.notification.create({
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