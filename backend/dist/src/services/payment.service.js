"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.releasePayment = exports.confirmPaymentHeld = exports.createPayment = void 0;
const stripe_1 = __importDefault(require("stripe"));
const db_1 = __importDefault(require("../config/db"));
const env_1 = require("../config/env");
const socket_1 = require("../config/socket");
const AppError_1 = require("../utils/AppError");
const payment_validator_1 = require("../validators/payment.validator");
const getStripe = () => {
    if (!env_1.env.STRIPE_SECRET_KEY) {
        throw new AppError_1.AppError("Stripe is not configured", 503);
    }
    return new stripe_1.default(env_1.env.STRIPE_SECRET_KEY);
};
const createPayment = async (userId, body) => {
    const data = payment_validator_1.createPaymentSchema.parse(body);
    const business = await db_1.default.business.findUnique({ where: { userId } });
    if (!business) {
        throw new AppError_1.AppError("Business profile not found", 404);
    }
    const application = await db_1.default.application.findFirst({
        where: { id: data.applicationId },
        include: {
            gig: true,
            student: { include: { user: true } },
        },
    });
    if (!application || application.gig.businessId !== business.id) {
        throw new AppError_1.AppError("Application not found or access denied", 404);
    }
    if (application.status !== "HIRED") {
        throw new AppError_1.AppError("Payment requires a hired application", 400);
    }
    const stripe = getStripe();
    const amountCents = Math.round(data.amount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: data.currency.toLowerCase(),
        metadata: {
            applicationId: data.applicationId,
            businessId: business.id,
        },
        capture_method: "manual",
    });
    const payment = await db_1.default.payment.create({
        data: {
            businessId: business.id,
            applicationId: data.applicationId,
            amount: data.amount,
            currency: data.currency,
            status: "PENDING",
            razorpayPaymentId: paymentIntent.id,
        },
    });
    return {
        payment,
        clientSecret: paymentIntent.client_secret,
    };
};
exports.createPayment = createPayment;
const confirmPaymentHeld = async (userId, paymentIntentId) => {
    const business = await db_1.default.business.findUnique({ where: { userId } });
    if (!business) {
        throw new AppError_1.AppError("Business profile not found", 404);
    }
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "requires_capture" &&
        intent.status !== "succeeded") {
        throw new AppError_1.AppError("Payment not completed", 400);
    }
    const payment = await db_1.default.payment.findFirst({
        where: {
            razorpayPaymentId: paymentIntentId,
            businessId: business.id,
        },
        include: {
            application: { include: { student: { include: { user: true } } } },
        },
    });
    if (!payment) {
        throw new AppError_1.AppError("Payment record not found", 404);
    }
    const updated = await db_1.default.payment.update({
        where: { id: payment.id },
        data: {
            status: "HELD",
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
exports.confirmPaymentHeld = confirmPaymentHeld;
const releasePayment = async (userId, body) => {
    const { paymentId } = payment_validator_1.releasePaymentSchema.parse(body);
    const business = await db_1.default.business.findUnique({ where: { userId } });
    if (!business) {
        throw new AppError_1.AppError("Business profile not found", 404);
    }
    const payment = await db_1.default.payment.findFirst({
        where: { id: paymentId, businessId: business.id },
    });
    if (!payment) {
        throw new AppError_1.AppError("Payment not found", 404);
    }
    if (payment.status !== "HELD") {
        throw new AppError_1.AppError("Only held payments can be released", 400);
    }
    if (payment.razorpayPaymentId && env_1.env.STRIPE_SECRET_KEY) {
        const stripe = getStripe();
        await stripe.paymentIntents.capture(payment.razorpayPaymentId);
    }
    return db_1.default.payment.update({
        where: { id: paymentId },
        data: {
            status: "RELEASED",
            processedAt: new Date(),
        },
    });
};
exports.releasePayment = releasePayment;
