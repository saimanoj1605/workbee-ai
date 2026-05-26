"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRefundDetails = exports.getRefundHistory = exports.handleRefundWebhook = exports.rejectRefund = exports.approveRefund = exports.processRefund = exports.initiateRefund = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const db_1 = __importDefault(require("../config/db"));
const env_1 = require("../config/env");
const socket_1 = require("../config/socket");
const AppError_1 = require("../utils/AppError");
const wallet_service_1 = require("./wallet.service");
// ============================================
// REFUND SYSTEM
// Handles payment refunds with proper validation
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
 * Initiate a refund request
 */
const initiateRefund = async (paymentId, reason, requestedByUserId) => {
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
    // Only HELD payments can be refunded (before release)
    if (payment.status !== "HELD") {
        throw new AppError_1.AppError("Only held payments can be refunded", 400);
    }
    // Check authorization - business owner or admin
    const businessUserId = payment.application?.gig?.business?.userId;
    if (businessUserId !== requestedByUserId) {
        const user = await db_1.default.user.findUnique({
            where: { id: requestedByUserId },
        });
        if (user?.role !== "ADMIN") {
            throw new AppError_1.AppError("Not authorized to request refund", 403);
        }
    }
    // Check if refund already exists
    const existingRefund = await db_1.default.refund.findUnique({
        where: { paymentId },
    });
    if (existingRefund) {
        throw new AppError_1.AppError("Refund already initiated for this payment", 400);
    }
    // Create refund record
    const refund = await db_1.default.refund.create({
        data: {
            paymentId,
            amount: payment.amount,
            reason,
            status: "PENDING",
            initiatedBy: requestedByUserId,
        },
    });
    // Update payment status
    await db_1.default.payment.update({
        where: { id: paymentId },
        data: { status: "CANCELLED" },
    });
    // Notify relevant parties
    (0, socket_1.getIO)().to(requestedByUserId).emit("refund_initiated", {
        refundId: refund.id,
        amount: payment.amount,
        status: "PENDING",
    });
    // Notify student
    const studentUserId = payment.application?.student?.userId;
    if (studentUserId) {
        (0, socket_1.getIO)().to(studentUserId).emit("payment_refunded", {
            paymentId,
            amount: payment.amount,
            gigTitle: payment.application?.gig?.title,
        });
    }
    return refund;
};
exports.initiateRefund = initiateRefund;
/**
 * Process refund via Razorpay
 */
const processRefund = async (refundId) => {
    const refund = await db_1.default.refund.findUnique({
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
        throw new AppError_1.AppError("Refund not found", 404);
    }
    if (refund.status !== "PENDING") {
        throw new AppError_1.AppError("Refund is not in pending state", 400);
    }
    // Update status to processing
    await db_1.default.refund.update({
        where: { id: refundId },
        data: { status: "PROCESSING" },
    });
    const razorpay = getRazorpay();
    try {
        // Process refund through Razorpay using payments.refund method
        const razorpayRefund = await razorpay.payments.refund(refund.payment.razorpayPaymentId, {
            amount: Math.round(refund.amount * 100), // Convert to paise
            speed: "normal",
            notes: {
                reason: refund.reason,
                refundId: refund.id,
            },
        });
        // Update refund record
        const updatedRefund = await db_1.default.refund.update({
            where: { id: refundId },
            data: {
                status: "COMPLETED",
                razorpayRefundId: razorpayRefund.id,
                processedBy: "system",
                processedAt: new Date(),
            },
        });
        // Update payment status
        await db_1.default.payment.update({
            where: { id: refund.paymentId },
            data: { status: "REFUNDED" },
        });
        // Notify business
        const businessUserId = refund.payment.application?.gig?.business?.userId;
        if (businessUserId) {
            (0, socket_1.getIO)().to(businessUserId).emit("refund_completed", {
                refundId: updatedRefund.id,
                amount: refund.amount,
                paymentId: refund.paymentId,
            });
        }
        return updatedRefund;
    }
    catch (error) {
        // Update refund status to failed
        await db_1.default.refund.update({
            where: { id: refundId },
            data: {
                status: "FAILED",
                processedAt: new Date(),
            },
        });
        // Revert payment status
        await db_1.default.payment.update({
            where: { id: refund.paymentId },
            data: { status: "HELD" },
        });
        throw new AppError_1.AppError(`Refund failed: ${error.message}`, 400);
    }
};
exports.processRefund = processRefund;
/**
 * Approve and process refund (admin action)
 */
const approveRefund = async (refundId, approvedByUserId) => {
    // Check if admin
    const user = await db_1.default.user.findUnique({
        where: { id: approvedByUserId },
    });
    if (user?.role !== "ADMIN") {
        throw new AppError_1.AppError("Only admins can approve refunds", 403);
    }
    const refund = await db_1.default.refund.findUnique({
        where: { id: refundId },
        include: {
            payment: true,
        },
    });
    if (!refund) {
        throw new AppError_1.AppError("Refund not found", 404);
    }
    if (refund.status !== "PENDING") {
        throw new AppError_1.AppError("Refund is not in pending state", 400);
    }
    // Approve and process
    await db_1.default.refund.update({
        where: { id: refundId },
        data: {
            status: "APPROVED",
            processedBy: approvedByUserId,
        },
    });
    return (0, exports.processRefund)(refundId);
};
exports.approveRefund = approveRefund;
/**
 * Reject refund request
 */
const rejectRefund = async (refundId, reason, rejectedByUserId) => {
    // Check if admin
    const user = await db_1.default.user.findUnique({
        where: { id: rejectedByUserId },
    });
    if (user?.role !== "ADMIN") {
        throw new AppError_1.AppError("Only admins can reject refunds", 403);
    }
    const refund = await db_1.default.refund.findUnique({
        where: { id: refundId },
        include: {
            payment: true,
        },
    });
    if (!refund) {
        throw new AppError_1.AppError("Refund not found", 404);
    }
    if (refund.status !== "PENDING") {
        throw new AppError_1.AppError("Refund is not in pending state", 400);
    }
    // Update refund status
    await db_1.default.refund.update({
        where: { id: refundId },
        data: {
            status: "REJECTED",
            processedBy: rejectedByUserId,
            processedAt: new Date(),
            metadata: { rejectionReason: reason },
        },
    });
    // Revert payment status
    await db_1.default.payment.update({
        where: { id: refund.paymentId },
        data: { status: "HELD" },
    });
    // Get business user for notification
    const payment = await db_1.default.payment.findUnique({
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
        (0, socket_1.getIO)().to(businessUserId).emit("refund_rejected", {
            refundId,
            reason,
        });
    }
    return { success: true, message: "Refund rejected" };
};
exports.rejectRefund = rejectRefund;
/**
 * Handle Razorpay refund webhook
 */
const handleRefundWebhook = async (razorpayRefundId, status) => {
    const refund = await db_1.default.refund.findFirst({
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
        throw new AppError_1.AppError("Refund not found", 404);
    }
    if (status === "processed") {
        // Refund completed - return funds to business wallet
        const businessUserId = refund.payment.application?.gig?.business?.userId;
        if (businessUserId) {
            await (0, wallet_service_1.addFundsToWallet)(businessUserId, refund.amount, `Refund for payment: ${refund.paymentId}`, undefined, refund.id);
        }
        // Notify business
        if (businessUserId) {
            (0, socket_1.getIO)().to(businessUserId).emit("refund_received", {
                refundId: refund.id,
                amount: refund.amount,
            });
        }
    }
    else {
        // Refund failed
        await db_1.default.refund.update({
            where: { id: refund.id },
            data: { status: "FAILED", processedAt: new Date() },
        });
        await db_1.default.payment.update({
            where: { id: refund.paymentId },
            data: { status: "HELD" },
        });
    }
    return refund;
};
exports.handleRefundWebhook = handleRefundWebhook;
/**
 * Get refund history for a user
 */
const getRefundHistory = async (userId, page = 1, limit = 20) => {
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new AppError_1.AppError("User not found", 404);
    }
    // Get refunds based on user role
    let whereClause = {};
    if (user.role === "BUSINESS") {
        const business = await db_1.default.business.findUnique({
            where: { userId },
        });
        if (business) {
            whereClause = {
                payment: {
                    businessId: business.id,
                },
            };
        }
    }
    else if (user.role === "ADMIN") {
        whereClause = {}; // Admin sees all refunds
    }
    else {
        return { refunds: [], pagination: { page, limit, total: 0, pages: 0 } };
    }
    const [refunds, total] = await db_1.default.$transaction([
        db_1.default.refund.findMany({
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
        db_1.default.refund.count({ where: whereClause }),
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
exports.getRefundHistory = getRefundHistory;
/**
 * Get single refund details
 */
const getRefundDetails = async (refundId) => {
    const refund = await db_1.default.refund.findUnique({
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
        throw new AppError_1.AppError("Refund not found", 404);
    }
    return refund;
};
exports.getRefundDetails = getRefundDetails;
