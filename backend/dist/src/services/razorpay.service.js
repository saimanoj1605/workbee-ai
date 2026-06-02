"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpayPayment = exports.createRazorpayOrder = void 0;
const crypto_1 = __importDefault(require("crypto"));
const razorpay_1 = __importDefault(require("razorpay"));
const db_1 = __importDefault(require("../config/db"));
const env_1 = require("../config/env");
const socket_1 = require("../config/socket");
const AppError_1 = require("../utils/AppError");
const getRazorpay = () => {
    if (!env_1.env.RAZORPAY_KEY_ID || !env_1.env.RAZORPAY_KEY_SECRET) {
        throw new AppError_1.AppError("Razorpay is not configured", 503);
    }
    return new razorpay_1.default({
        key_id: env_1.env.RAZORPAY_KEY_ID,
        key_secret: env_1.env.RAZORPAY_KEY_SECRET,
    });
};
const createRazorpayOrder = async (userId, applicationId, amountInr) => {
    const business = await db_1.default.business.findUnique({ where: { userId } });
    if (!business)
        throw new AppError_1.AppError("Business profile required", 403);
    const application = await db_1.default.application.findFirst({
        where: { id: applicationId },
        include: { gig: true, student: { include: { user: true } } },
    });
    if (!application || application.gig.businessId !== business.id) {
        throw new AppError_1.AppError("Application not found", 404);
    }
    if (application.status !== "HIRED") {
        throw new AppError_1.AppError("Application must be hired first", 400);
    }
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
        amount: Math.round(amountInr * 100),
        currency: "INR",
        receipt: `app_${applicationId.slice(0, 8)}`,
    });
    const payment = await db_1.default.payment.create({
        data: {
            businessId: business.id,
            applicationId,
            amount: amountInr,
            currency: "INR",
            status: "PENDING",
            razorpayPaymentId: order.id,
        },
    });
    return {
        payment,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: env_1.env.RAZORPAY_KEY_ID,
    };
};
exports.createRazorpayOrder = createRazorpayOrder;
const verifyRazorpayPayment = async (userId, body) => {
    if (!env_1.env.RAZORPAY_KEY_SECRET) {
        throw new AppError_1.AppError("Razorpay is not configured", 503);
    }
    const expected = crypto_1.default
        .createHmac("sha256", env_1.env.RAZORPAY_KEY_SECRET)
        .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
        .digest("hex");
    if (expected !== body.razorpay_signature) {
        throw new AppError_1.AppError("Invalid payment signature", 400);
    }
    const business = await db_1.default.business.findUnique({ where: { userId } });
    if (!business)
        throw new AppError_1.AppError("Business profile required", 403);
    const payment = await db_1.default.payment.findFirst({
        where: {
            razorpayPaymentId: body.razorpay_order_id,
            businessId: business.id,
        },
        include: {
            application: { include: { student: { include: { user: true } } } },
        },
    });
    if (!payment)
        throw new AppError_1.AppError("Payment not found", 404);
    const updated = await db_1.default.payment.update({
        where: { id: payment.id },
        data: {
            status: "HELD",
            razorpayPaymentId: body.razorpay_payment_id,
            processedAt: new Date(),
        },
    });
    if (payment.application?.student.userId) {
        (0, socket_1.getIO)()
            .to(payment.application.student.userId)
            .emit("payment_received", updated);
    }
    return updated;
};
exports.verifyRazorpayPayment = verifyRazorpayPayment;
