"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayoutDetails = exports.getPayoutHistory = exports.handlePayoutWebhook = exports.processPayout = exports.requestPayout = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const db_1 = __importDefault(require("../config/db"));
const env_1 = require("../config/env");
const socket_1 = require("../config/socket");
const AppError_1 = require("../utils/AppError");
const wallet_service_1 = require("./wallet.service");
// ============================================
// PAYOUT SYSTEM
// Handles student withdrawals to bank/UPI
// ============================================
const getRazorpay = () => {
    if (!env_1.env.RAZORPAY_KEY_ID || !env_1.env.RAZORPAY_KEY_SECRET) {
        throw new AppError_1.AppError("Razorpay is not configured", 503);
    }
    return new razorpay_1.default({
        key_id: env_1.env.RAZORPAY_KEY_ID,
        key_secret: env_1.env.RAZORPAY_KEY_SECRET,
    });
};
/**
 * Request a payout (withdrawal) from wallet
 */
const requestPayout = async (userId, amount, payoutMethod, payoutDetails) => {
    const wallet = await (0, wallet_service_1.getOrCreateWallet)(userId);
    // Check wallet status
    if (wallet.status !== "ACTIVE") {
        throw new AppError_1.AppError("Wallet is not active", 400);
    }
    // Check KYC
    if (!wallet.kycVerified) {
        throw new AppError_1.AppError("KYC verification required before withdrawal", 400);
    }
    // Check balance
    if (wallet.balance < amount) {
        throw new AppError_1.AppError("Insufficient wallet balance", 400);
    }
    // Minimum payout amount
    const MIN_PAYOUT = 100;
    if (amount < MIN_PAYOUT) {
        throw new AppError_1.AppError(`Minimum payout amount is ₹${MIN_PAYOUT}`, 400);
    }
    // Validate payout details
    if (payoutMethod === "UPI" && !payoutDetails.upiId) {
        throw new AppError_1.AppError("UPI ID is required for UPI payouts", 400);
    }
    if (payoutMethod === "BANK") {
        if (!payoutDetails.accountNumber || !payoutDetails.ifscCode) {
            throw new AppError_1.AppError("Account number and IFSC code are required for bank payouts", 400);
        }
    }
    // Deduct from wallet immediately (funds held until payout completes)
    await (0, wallet_service_1.deductFromWallet)(userId, amount, `Payout request via ${payoutMethod}`);
    // Create payout record
    const payout = await db_1.default.payout.create({
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
    (0, socket_1.getIO)().to(userId).emit("payout_requested", {
        payoutId: payout.id,
        amount,
        status: "PENDING",
    });
    return payout;
};
exports.requestPayout = requestPayout;
/**
 * Process payout via Razorpay
 */
const processPayout = async (payoutId) => {
    const payout = await db_1.default.payout.findUnique({
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
        throw new AppError_1.AppError("Payout not found", 404);
    }
    if (payout.status !== "PENDING") {
        throw new AppError_1.AppError("Payout is not in pending state", 400);
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
        });
        // Update payout record
        const updatedPayout = await db_1.default.payout.update({
            where: { id: payoutId },
            data: {
                status: "PROCESSING",
                razorpayPayoutId: razorpayTransfer.id,
            },
        });
        // Notify user
        (0, socket_1.getIO)().to(payout.userId).emit("payout_processing", {
            payoutId: updatedPayout.id,
            razorpayPayoutId: razorpayTransfer.id,
        });
        return updatedPayout;
    }
    catch (error) {
        // Update payout status to failed
        await db_1.default.payout.update({
            where: { id: payoutId },
            data: {
                status: "FAILED",
                failureReason: error.message || "Payout processing failed",
            },
        });
        // Refund back to wallet
        await db_1.default.wallet.update({
            where: { id: payout.walletId },
            data: {
                balance: {
                    increment: payout.amount,
                },
            },
        });
        // Record refund transaction
        await db_1.default.transaction.create({
            data: {
                walletId: payout.walletId,
                type: "REFUND",
                amount: payout.amount,
                currency: "INR",
                status: "COMPLETED",
                description: "Payout failed - amount refunded",
            },
        });
        throw new AppError_1.AppError(`Payout failed: ${error.message}`, 400);
    }
};
exports.processPayout = processPayout;
/**
 * Handle Razorpay payout webhook
 */
const handlePayoutWebhook = async (payoutId, status, razorpayPayoutId) => {
    const payout = await db_1.default.payout.findFirst({
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
        throw new AppError_1.AppError("Payout not found", 404);
    }
    let newStatus;
    let failureReason = null;
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
    const updatedPayout = await db_1.default.payout.update({
        where: { id: payout.id },
        data: {
            status: newStatus,
            failureReason,
            processedAt: new Date(),
        },
    });
    // If failed or rejected, refund to wallet
    if (newStatus !== "COMPLETED") {
        await db_1.default.wallet.update({
            where: { id: payout.walletId },
            data: {
                balance: {
                    increment: payout.amount,
                },
            },
        });
        await db_1.default.transaction.create({
            data: {
                walletId: payout.walletId,
                type: "REFUND",
                amount: payout.amount,
                currency: "INR",
                status: "COMPLETED",
                description: `Payout ${status} - amount refunded`,
            },
        });
    }
    else {
        // Update lastWithdrawnAt
        await db_1.default.wallet.update({
            where: { id: payout.walletId },
            data: {
                lastWithdrawnAt: new Date(),
            },
        });
    }
    // Notify user
    (0, socket_1.getIO)().to(payout.userId).emit("payout_updated", {
        payoutId: updatedPayout.id,
        status: newStatus,
        amount: payout.amount,
    });
    return updatedPayout;
};
exports.handlePayoutWebhook = handlePayoutWebhook;
/**
 * Get payout history for user
 */
const getPayoutHistory = async (userId, page = 1, limit = 20) => {
    const [payouts, total] = await db_1.default.$transaction([
        db_1.default.payout.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db_1.default.payout.count({ where: { userId } }),
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
exports.getPayoutHistory = getPayoutHistory;
/**
 * Get single payout details
 */
const getPayoutDetails = async (payoutId, userId) => {
    const payout = await db_1.default.payout.findFirst({
        where: { id: payoutId, userId },
        include: {
            wallet: true,
        },
    });
    if (!payout) {
        throw new AppError_1.AppError("Payout not found", 404);
    }
    return payout;
};
exports.getPayoutDetails = getPayoutDetails;
