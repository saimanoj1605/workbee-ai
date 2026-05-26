"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateRefundFromEscrow = exports.autoReleasePayment = exports.releasePaymentFromEscrow = exports.holdPaymentInEscrow = exports.calculatePaymentSplit = void 0;
const db_1 = __importDefault(require("../config/db"));
const socket_1 = require("../config/socket");
const AppError_1 = require("../utils/AppError");
const wallet_service_1 = require("./wallet.service");
// ============================================
// ESCROW SYSTEM
// Holds payments securely until work is completed
// ============================================
const COMMISSION_PERCENT = 10; // WorkBee takes 10% commission
/**
 * Calculate commission and net amount
 */
const calculatePaymentSplit = (amount, commissionPercent = COMMISSION_PERCENT) => {
    const commissionAmount = (amount * commissionPercent) / 100;
    const netAmount = amount - commissionAmount;
    return { commissionAmount, netAmount, commissionPercent };
};
exports.calculatePaymentSplit = calculatePaymentSplit;
/**
 * Hold payment in escrow after successful Razorpay payment
 */
const holdPaymentInEscrow = async (paymentId, razorpayPaymentId, razorpaySignature) => {
    const payment = await db_1.default.payment.findUnique({
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
        throw new AppError_1.AppError("Payment not found", 404);
    }
    if (payment.status !== "PENDING") {
        throw new AppError_1.AppError("Payment cannot be processed", 400);
    }
    // Calculate commission
    const { commissionAmount, netAmount } = (0, exports.calculatePaymentSplit)(payment.amount, payment.commissionPercent);
    // Update payment to HELD status
    const updatedPayment = await db_1.default.payment.update({
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
        (0, socket_1.getIO)().to(payment.application.student.userId).emit("payment_held", {
            paymentId: updatedPayment.id,
            amount: updatedPayment.amount,
            gigTitle: payment.application.gig.title,
        });
    }
    // Notify business
    if (payment.application?.gig?.businessId) {
        const business = await db_1.default.business.findUnique({
            where: { id: payment.application.gig.businessId },
            include: { user: true },
        });
        if (business?.userId) {
            (0, socket_1.getIO)().to(business.userId).emit("payment_secured", {
                paymentId: updatedPayment.id,
                amount: updatedPayment.amount,
            });
        }
    }
    return updatedPayment;
};
exports.holdPaymentInEscrow = holdPaymentInEscrow;
/**
 * Release payment from escrow to student wallet
 */
const releasePaymentFromEscrow = async (paymentId, releasedByUserId) => {
    const payment = await db_1.default.payment.findUnique({
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
        throw new AppError_1.AppError("Payment not found", 404);
    }
    if (payment.status !== "HELD") {
        throw new AppError_1.AppError("Only held payments can be released", 400);
    }
    // Verify the person releasing is authorized (business or admin)
    const business = payment.application?.gig?.business;
    if (business?.userId !== releasedByUserId) {
        // Check if admin
        const user = await db_1.default.user.findUnique({
            where: { id: releasedByUserId },
        });
        if (user?.role !== "ADMIN") {
            throw new AppError_1.AppError("Not authorized to release this payment", 403);
        }
    }
    // Update payment status
    const updatedPayment = await db_1.default.payment.update({
        where: { id: paymentId },
        data: {
            status: "RELEASED",
            releasedAt: new Date(),
        },
    });
    // Add net amount to student wallet
    const studentUserId = payment.application?.student?.userId;
    if (studentUserId && payment.netAmount > 0) {
        await (0, wallet_service_1.addFundsToWallet)(studentUserId, payment.netAmount, `Payment released for gig: ${payment.application?.gig?.title}`, payment.razorpayPaymentId || undefined, paymentId);
    }
    // Record commission transaction for platform
    if (payment.commissionAmount > 0) {
        await db_1.default.transaction.create({
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
    await db_1.default.application.update({
        where: { id: payment.applicationId },
        data: {
            status: "HIRED", // Could add a COMPLETED status
        },
    });
    // Notify student
    if (studentUserId) {
        (0, socket_1.getIO)().to(studentUserId).emit("payment_released", {
            paymentId: updatedPayment.id,
            amount: payment.netAmount,
            gigTitle: payment.application?.gig?.title,
        });
    }
    // Notify business
    if (business?.userId) {
        (0, socket_1.getIO)().to(business.userId).emit("payment_completed", {
            paymentId: updatedPayment.id,
            amount: payment.amount,
        });
    }
    return updatedPayment;
};
exports.releasePaymentFromEscrow = releasePaymentFromEscrow;
/**
 * Auto-release payment after deadline if not manually released
 */
const autoReleasePayment = async (paymentId) => {
    const payment = await db_1.default.payment.findUnique({
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
        throw new AppError_1.AppError("Cannot auto-release: no business associated", 400);
    }
    return (0, exports.releasePaymentFromEscrow)(paymentId, businessUserId);
};
exports.autoReleasePayment = autoReleasePayment;
/**
 * Initiate refund from escrow back to business
 */
const initiateRefundFromEscrow = async (paymentId, reason, initiatedByUserId) => {
    const payment = await db_1.default.payment.findUnique({
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
        throw new AppError_1.AppError("Payment not found", 404);
    }
    if (payment.status !== "HELD") {
        throw new AppError_1.AppError("Only held payments can be refunded", 400);
    }
    // Verify authorization
    const businessUserId = payment.application?.gig?.business?.userId;
    if (businessUserId !== initiatedByUserId) {
        const user = await db_1.default.user.findUnique({
            where: { id: initiatedByUserId },
        });
        if (user?.role !== "ADMIN") {
            throw new AppError_1.AppError("Not authorized to refund this payment", 403);
        }
    }
    // Create refund record
    const refund = await db_1.default.refund.create({
        data: {
            paymentId,
            amount: payment.amount,
            reason,
            status: "PENDING",
            initiatedBy: initiatedByUserId,
        },
    });
    // Update payment status
    await db_1.default.payment.update({
        where: { id: paymentId },
        data: { status: "CANCELLED" },
    });
    // Notify relevant parties
    (0, socket_1.getIO)().to(initiatedByUserId).emit("refund_initiated", {
        refundId: refund.id,
        amount: payment.amount,
    });
    return refund;
};
exports.initiateRefundFromEscrow = initiateRefundFromEscrow;
