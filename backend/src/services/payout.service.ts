import Razorpay from "razorpay";
import prisma from "../config/db";
import { env } from "../config/env";
import { getIO } from "../config/socket";
import { AppError } from "../utils/AppError";
import { deductFromWallet, getOrCreateWallet } from "./wallet.service";

// ============================================
// PAYOUT SYSTEM
// Handles student withdrawals to bank/UPI
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
 * Request a payout (withdrawal) from wallet
 */
export const requestPayout = async (
  userId: string,
  amount: number,
  payoutMethod: "UPI" | "BANK",
  payoutDetails: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
  }
) => {
  const wallet = await getOrCreateWallet(userId);

  // Check wallet status
  if (wallet.status !== "ACTIVE") {
    throw new AppError("Wallet is not active", 400);
  }

  // Check KYC
  if (!wallet.kycVerified) {
    throw new AppError("KYC verification required before withdrawal", 400);
  }

  // Check balance
  if (wallet.balance < amount) {
    throw new AppError("Insufficient wallet balance", 400);
  }

  // Minimum payout amount
  const MIN_PAYOUT = 100;
  if (amount < MIN_PAYOUT) {
    throw new AppError(`Minimum payout amount is ₹${MIN_PAYOUT}`, 400);
  }

  // Validate payout details
  if (payoutMethod === "UPI" && !payoutDetails.upiId) {
    throw new AppError("UPI ID is required for UPI payouts", 400);
  }
  if (payoutMethod === "BANK") {
    if (!payoutDetails.accountNumber || !payoutDetails.ifscCode) {
      throw new AppError("Account number and IFSC code are required for bank payouts", 400);
    }
  }

  // Deduct from wallet immediately (funds held until payout completes)
  await deductFromWallet(userId, amount, `Payout request via ${payoutMethod}`);

  // Create payout record
  const payout = await prisma.payout.create({
    data: {
      walletId: wallet.id,
      userId,
      amount,
      currency: "INR",
      status: "PENDING",
      payoutMethod,
      upiId: payoutDetails.upiId,
      accountNumber: payoutDetails.accountNumber,
      ifscCode: payoutDetails.ifscCode,
      description: `Withdrawal via ${payoutMethod}`,
    },
  });

  // Notify user
  getIO().to(userId).emit("payout_requested", {
    payoutId: payout.id,
    amount,
    status: "PENDING",
  });

  return payout;
};

/**
 * Process payout via Razorpay
 */
export const processPayout = async (payoutId: string) => {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: {
      wallet: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!payout) {
    throw new AppError("Payout not found", 404);
  }

  if (payout.status !== "PENDING") {
    throw new AppError("Payout is not in pending state", 400);
  }

  const razorpay = getRazorpay();

  try {
    // Create Razorpay transfer (payout)
    // Using transfers API for payouts to bank accounts/UPI
    const razorpayTransfer = await razorpay.transfers.create({
      amount: Math.round(payout.amount * 100), // Convert to paise
      currency: "INR",
      account_number: payout.accountNumber || "",
      ifsc: payout.ifscCode || "",
      beneficiary_name: payout.wallet.user.fullName,
      // For UPI, we use the upi field
      vpa: payout.upiId || undefined,
    } as any);

    // Update payout record
    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "PROCESSING",
        razorpayPayoutId: razorpayTransfer.id,
      },
    });

    // Notify user
    getIO().to(payout.userId).emit("payout_processing", {
      payoutId: updatedPayout.id,
      razorpayPayoutId: razorpayTransfer.id,
    });

    return updatedPayout;
  } catch (error: any) {
    // Update payout status to failed
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "FAILED",
        failureReason: error.message || "Payout processing failed",
      },
    });

    // Refund back to wallet
    await prisma.wallet.update({
      where: { id: payout.walletId },
      data: {
        balance: {
          increment: payout.amount,
        },
      },
    });

    // Record refund transaction
    await prisma.transaction.create({
      data: {
        walletId: payout.walletId,
        type: "REFUND",
        amount: payout.amount,
        currency: "INR",
        status: "COMPLETED",
        description: "Payout failed - amount refunded",
      },
    });

    throw new AppError(`Payout failed: ${error.message}`, 400);
  }
};

/**
 * Handle Razorpay payout webhook
 */
export const handlePayoutWebhook = async (
  payoutId: string,
  status: "processed" | "failed" | "rejected",
  razorpayPayoutId: string
) => {
  const payout = await prisma.payout.findFirst({
    where: { razorpayPayoutId },
    include: {
      wallet: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!payout) {
    throw new AppError("Payout not found", 404);
  }

  let newStatus: "COMPLETED" | "FAILED" | "REJECTED";
  let failureReason: string | null = null;

  switch (status) {
    case "processed":
      newStatus = "COMPLETED";
      break;
    case "failed":
      newStatus = "FAILED";
      failureReason = "Payout processing failed";
      break;
    case "rejected":
      newStatus = "REJECTED";
      failureReason = "Payout rejected by bank";
      break;
    default:
      newStatus = "FAILED";
  }

  const updatedPayout = await prisma.payout.update({
    where: { id: payout.id },
    data: {
      status: newStatus,
      failureReason,
      processedAt: new Date(),
    },
  });

  // If failed or rejected, refund to wallet
  if (newStatus !== "COMPLETED") {
    await prisma.wallet.update({
      where: { id: payout.walletId },
      data: {
        balance: {
          increment: payout.amount,
        },
      },
    });

    await prisma.transaction.create({
      data: {
        walletId: payout.walletId,
        type: "REFUND",
        amount: payout.amount,
        currency: "INR",
        status: "COMPLETED",
        description: `Payout ${status} - amount refunded`,
      },
    });
  } else {
    // Update lastWithdrawnAt
    await prisma.wallet.update({
      where: { id: payout.walletId },
      data: {
        lastWithdrawnAt: new Date(),
      },
    });
  }

  // Notify user
  getIO().to(payout.userId).emit("payout_updated", {
    payoutId: updatedPayout.id,
    status: newStatus,
    amount: payout.amount,
  });

  return updatedPayout;
};

/**
 * Get payout history for user
 */
export const getPayoutHistory = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const [payouts, total] = await prisma.$transaction([
    prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payout.count({ where: { userId } }),
  ]);

  return {
    payouts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single payout details
 */
export const getPayoutDetails = async (payoutId: string, userId: string) => {
  const payout = await prisma.payout.findFirst({
    where: { id: payoutId, userId },
    include: {
      wallet: true,
    },
  });

  if (!payout) {
    throw new AppError("Payout not found", 404);
  }

  return payout;
};