import prisma from "../config/db";
import { getIO } from "../config/socket";
import { AppError } from "../utils/AppError";
import { addFundsToWallet } from "./wallet.service";

// ============================================
// ESCROW SYSTEM
// Holds payments securely until work is completed
// ============================================

const COMMISSION_PERCENT = 10; // WorkBee takes 10% commission

/**
 * Calculate commission and net amount
 */
export const calculatePaymentSplit = (amount: number, commissionPercent: number = COMMISSION_PERCENT) => {
  const commissionAmount = (amount * commissionPercent) / 100;
  const netAmount = amount - commissionAmount;
  return { commissionAmount, netAmount, commissionPercent };
};

/**
 * Hold payment in escrow after successful Razorpay payment
 */
export const holdPaymentInEscrow = async (
  paymentId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
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
    throw new AppError("Payment not found", 404);
  }

  if (payment.status !== "PENDING") {
    throw new AppError("Payment cannot be processed", 400);
  }

  // Calculate commission
  const { commissionAmount, netAmount } = calculatePaymentSplit(
    payment.amount,
    payment.commissionPercent
  );

  // Update payment to HELD status
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "HELD",
      razorpayPaymentId,
      razorpaySignature,
      commissionAmount,
      netAmount,
      heldAt: new Date(),
      processedAt: new Date(),
    },
  });

  // Notify student that payment is secured
  if (payment.application?.student?.userId) {
    getIO().to(payment.application.student.userId).emit("payment_held", {
      paymentId: updatedPayment.id,
      amount: updatedPayment.amount,
      gigTitle: payment.application.gig.title,
    });
  }

  // Notify business
  if (payment.application?.gig?.businessId) {
    const business = await prisma.business.findUnique({
      where: { id: payment.application.gig.businessId },
      include: { user: true },
    });
    if (business?.userId) {
      getIO().to(business.userId).emit("payment_secured", {
        paymentId: updatedPayment.id,
        amount: updatedPayment.amount,
      });
    }
  }

  return updatedPayment;
};

/**
 * Release payment from escrow to student wallet
 */
export const releasePaymentFromEscrow = async (
  paymentId: string,
  releasedByUserId: string
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

  if (payment.status !== "HELD") {
    throw new AppError("Only held payments can be released", 400);
  }

  // Verify the person releasing is authorized (business or admin)
  const business = payment.application?.gig?.business;
  if (business?.userId !== releasedByUserId) {
    // Check if admin
    const user = await prisma.user.findUnique({
      where: { id: releasedByUserId },
    });
    if (user?.role !== "ADMIN") {
      throw new AppError("Not authorized to release this payment", 403);
    }
  }

  // Update payment status
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "RELEASED",
      releasedAt: new Date(),
    },
  });

  // Add net amount to student wallet
  const studentUserId = payment.application?.student?.userId;
  if (studentUserId && payment.netAmount > 0) {
    await addFundsToWallet(
      studentUserId,
      payment.netAmount,
      `Payment released for gig: ${payment.application?.gig?.title}`,
      payment.razorpayPaymentId || undefined,
      paymentId
    );
  }

  // Record commission transaction for platform
  if (payment.commissionAmount > 0) {
    await prisma.transaction.create({
      data: {
        walletId: "platform", // Platform wallet
        type: "COMMISSION",
        amount: payment.commissionAmount,
        currency: "INR",
        status: "COMPLETED",
        description: `Commission from payment ${paymentId}`,
        paymentId: payment.id,
      },
    });
  }

  // Update application status to completed
  await prisma.application.update({
    where: { id: payment.applicationId! },
    data: {
      status: "HIRED", // Could add a COMPLETED status
    },
  });

  // Notify student
  if (studentUserId) {
    getIO().to(studentUserId).emit("payment_released", {
      paymentId: updatedPayment.id,
      amount: payment.netAmount,
      gigTitle: payment.application?.gig?.title,
    });
  }

  // Notify business
  if (business?.userId) {
    getIO().to(business.userId).emit("payment_completed", {
      paymentId: updatedPayment.id,
      amount: payment.amount,
    });
  }

  return updatedPayment;
};

/**
 * Auto-release payment after deadline if not manually released
 */
export const autoReleasePayment = async (paymentId: string) => {
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

  if (!payment || payment.status !== "HELD") {
    return null;
  }

  // Use business userId for release authorization
  const businessUserId = payment.application?.gig?.business?.userId;
  if (!businessUserId) {
    throw new AppError("Cannot auto-release: no business associated", 400);
  }

  return releasePaymentFromEscrow(paymentId, businessUserId);
};

/**
 * Initiate refund from escrow back to business
 */
export const initiateRefundFromEscrow = async (
  paymentId: string,
  reason: string,
  initiatedByUserId: string
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      application: {
        include: {
          gig: { include: { business: { include: { user: true } } } },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.status !== "HELD") {
    throw new AppError("Only held payments can be refunded", 400);
  }

  // Verify authorization
  const businessUserId = payment.application?.gig?.business?.userId;
  if (businessUserId !== initiatedByUserId) {
    const user = await prisma.user.findUnique({
      where: { id: initiatedByUserId },
    });
    if (user?.role !== "ADMIN") {
      throw new AppError("Not authorized to refund this payment", 403);
    }
  }

  // Create refund record
  const refund = await prisma.refund.create({
    data: {
      paymentId,
      amount: payment.amount,
      reason,
      status: "PENDING",
      initiatedBy: initiatedByUserId,
    },
  });

  // Update payment status
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "CANCELLED" },
  });

  // Notify relevant parties
  getIO().to(initiatedByUserId).emit("refund_initiated", {
    refundId: refund.id,
    amount: payment.amount,
  });

  return refund;
};