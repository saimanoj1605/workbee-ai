import Razorpay from "razorpay";
import prisma from "../config/db";
import { env } from "../config/env";
import { getIO } from "../config/socket";
import { AppError } from "../utils/AppError";
import { addFundsToWallet } from "./wallet.service";

// ============================================
// REFUND SYSTEM
// Handles payment refunds with proper validation
// ============================================

const getRazorpay = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError("Razorpay is not configured", 503);
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * Initiate a refund request
 */
export const initiateRefund = async (
  paymentId: string,
  reason: string,
  requestedByUserId: string
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      application: {
        include: {
          student: { include: { user: true } },
          gig: { include: { business: { include: { user: true } } } },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  // Only HELD payments can be refunded (before release)
  if (payment.status !== "HELD") {
    throw new AppError("Only held payments can be refunded", 400);
  }

  // Check authorization - business owner or admin
  const businessUserId = payment.application?.gig?.business?.userId;
  if (businessUserId !== requestedByUserId) {
    const user = await prisma.user.findUnique({
      where: { id: requestedByUserId },
    });
    if (user?.role !== "ADMIN") {
      throw new AppError("Not authorized to request refund", 403);
    }
  }

  // Check if refund already exists
  const existingRefund = await prisma.refund.findUnique({
    where: { paymentId },
  });

  if (existingRefund) {
    throw new AppError("Refund already initiated for this payment", 400);
  }

  // Create refund record
  const refund = await prisma.refund.create({
    data: {
      paymentId,
      amount: payment.amount,
      reason,
      status: "PENDING",
      initiatedBy: requestedByUserId,
    },
  });

  // Update payment status
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "CANCELLED" },
  });

  // Notify relevant parties
  getIO().to(requestedByUserId).emit("refund_initiated", {
    refundId: refund.id,
    amount: payment.amount,
    status: "PENDING",
  });

  // Notify student
  const studentUserId = payment.application?.student?.userId;
  if (studentUserId) {
    getIO().to(studentUserId).emit("payment_refunded", {
      paymentId,
      amount: payment.amount,
      gigTitle: payment.application?.gig?.title,
    });
  }

  return refund;
};

/**
 * Process refund via Razorpay
 */
export const processRefund = async (refundId: string) => {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: {
      payment: {
        include: {
          application: {
            include: {
              gig: { include: { business: { include: { user: true } } } },
            },
          },
        },
      },
    },
  });

  if (!refund) {
    throw new AppError("Refund not found", 404);
  }

  if (refund.status !== "PENDING") {
    throw new AppError("Refund is not in pending state", 400);
  }

  // Update status to processing
  await prisma.refund.update({
    where: { id: refundId },
    data: { status: "PROCESSING" },
  });

  const razorpay = getRazorpay();

  try {
    // Process refund through Razorpay using payments.refund method
    const razorpayRefund = await razorpay.payments.refund(
      refund.payment.razorpayPaymentId!,
      {
        amount: Math.round(refund.amount * 100), // Convert to paise
        speed: "normal",
        notes: {
          reason: refund.reason,
          refundId: refund.id,
        },
      }
    );

    // Update refund record
    const updatedRefund = await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: "COMPLETED",
        razorpayRefundId: razorpayRefund.id,
        processedBy: "system",
        processedAt: new Date(),
      },
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: refund.paymentId },
      data: { status: "REFUNDED" },
    });

    // Notify business
    const businessUserId = refund.payment.application?.gig?.business?.userId;
    if (businessUserId) {
      getIO().to(businessUserId).emit("refund_completed", {
        refundId: updatedRefund.id,
        amount: refund.amount,
        paymentId: refund.paymentId,
      });
    }

    return updatedRefund;
  } catch (error: any) {
    // Update refund status to failed
    await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: "FAILED",
        processedAt: new Date(),
      },
    });

    // Revert payment status
    await prisma.payment.update({
      where: { id: refund.paymentId },
      data: { status: "HELD" },
    });

    throw new AppError(`Refund failed: ${error.message}`, 400);
  }
};

/**
 * Approve and process refund (admin action)
 */
export const approveRefund = async (
  refundId: string,
  approvedByUserId: string
) => {
  // Check if admin
  const user = await prisma.user.findUnique({
    where: { id: approvedByUserId },
  });

  if (user?.role !== "ADMIN") {
    throw new AppError("Only admins can approve refunds", 403);
  }

  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: {
      payment: true,
    },
  });

  if (!refund) {
    throw new AppError("Refund not found", 404);
  }

  if (refund.status !== "PENDING") {
    throw new AppError("Refund is not in pending state", 400);
  }

  // Approve and process
  await prisma.refund.update({
    where: { id: refundId },
    data: {
      status: "APPROVED",
      processedBy: approvedByUserId,
    },
  });

  return processRefund(refundId);
};

/**
 * Reject refund request
 */
export const rejectRefund = async (
  refundId: string,
  reason: string,
  rejectedByUserId: string
) => {
  // Check if admin
  const user = await prisma.user.findUnique({
    where: { id: rejectedByUserId },
  });

  if (user?.role !== "ADMIN") {
    throw new AppError("Only admins can reject refunds", 403);
  }

  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: {
      payment: true,
    },
  });

  if (!refund) {
    throw new AppError("Refund not found", 404);
  }

  if (refund.status !== "PENDING") {
    throw new AppError("Refund is not in pending state", 400);
  }

  // Update refund status
  await prisma.refund.update({
    where: { id: refundId },
    data: {
      status: "REJECTED",
      processedBy: rejectedByUserId,
      processedAt: new Date(),
      metadata: { rejectionReason: reason },
    },
  });

  // Revert payment status
  await prisma.payment.update({
    where: { id: refund.paymentId },
    data: { status: "HELD" },
  });

  // Get business user for notification
  const payment = await prisma.payment.findUnique({
    where: { id: refund.paymentId },
    include: {
      application: {
        include: {
          gig: { include: { business: { include: { user: true } } } },
        },
      },
    },
  });

  // Notify business
  const businessUserId = payment?.application?.gig?.business?.userId;
  if (businessUserId) {
    getIO().to(businessUserId).emit("refund_rejected", {
      refundId,
      reason,
    });
  }

  return { success: true, message: "Refund rejected" };
};

/**
 * Handle Razorpay refund webhook
 */
export const handleRefundWebhook = async (
  razorpayRefundId: string,
  status: "processed" | "failed"
) => {
  const refund = await prisma.refund.findFirst({
    where: { razorpayRefundId },
    include: {
      payment: {
        include: {
          application: {
            include: {
              student: { include: { user: true } },
              gig: { include: { business: { include: { user: true } } } },
            },
          },
        },
      },
    },
  });

  if (!refund) {
    throw new AppError("Refund not found", 404);
  }

  if (status === "processed") {
    // Refund completed - return funds to business wallet
    const businessUserId = refund.payment.application?.gig?.business?.userId;
    if (businessUserId) {
      await addFundsToWallet(
        businessUserId,
        refund.amount,
        `Refund for payment: ${refund.paymentId}`,
        undefined,
        refund.id
      );
    }

    // Notify business
    if (businessUserId) {
      getIO().to(businessUserId).emit("refund_received", {
        refundId: refund.id,
        amount: refund.amount,
      });
    }
  } else {
    // Refund failed
    await prisma.refund.update({
      where: { id: refund.id },
      data: { status: "FAILED", processedAt: new Date() },
    });

    await prisma.payment.update({
      where: { id: refund.paymentId },
      data: { status: "HELD" },
    });
  }

  return refund;
};

/**
 * Get refund history for a user
 */
export const getRefundHistory = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Get refunds based on user role
  let whereClause: any = {};

  if (user.role === "BUSINESS") {
    const business = await prisma.business.findUnique({
      where: { userId },
    });
    if (business) {
      whereClause = {
        payment: {
          businessId: business.id,
        },
      };
    }
  } else if (user.role === "ADMIN") {
    whereClause = {}; // Admin sees all refunds
  } else {
    return { refunds: [], pagination: { page, limit, total: 0, pages: 0 } };
  }

  const [refunds, total] = await prisma.$transaction([
    prisma.refund.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            application: {
              select: {
                gig: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.refund.count({ where: whereClause }),
  ]);

  return {
    refunds,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single refund details
 */
export const getRefundDetails = async (refundId: string) => {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: {
      payment: {
        include: {
          application: {
            include: {
              student: { select: { user: { select: { fullName: true, email: true } } } },
              gig: { select: { title: true, business: { select: { businessName: true } } } },
            },
          },
        },
      },
    },
  });

  if (!refund) {
    throw new AppError("Refund not found", 404);
  }

  return refund;
};