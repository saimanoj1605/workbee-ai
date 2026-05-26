import crypto from "crypto";
import Razorpay from "razorpay";

import prisma from "../config/db";
import { env } from "../config/env";
import { getIO } from "../config/socket";
import { AppError } from "../utils/AppError";

const getRazorpay = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError("Razorpay is not configured", 503);
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};

export const createRazorpayOrder = async (
  userId: string,
  applicationId: string,
  amountInr: number
) => {
  const business = await prisma.business.findUnique({ where: { userId } });
  if (!business) throw new AppError("Business profile required", 403);

  const application = await prisma.application.findFirst({
    where: { id: applicationId },
    include: { gig: true, student: { include: { user: true } } },
  });
  if (!application || application.gig.businessId !== business.id) {
    throw new AppError("Application not found", 404);
  }
  if (application.status !== "HIRED") {
    throw new AppError("Application must be hired first", 400);
  }

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(amountInr * 100),
    currency: "INR",
    receipt: `app_${applicationId.slice(0, 8)}`,
  });

  const payment = await prisma.payment.create({
    data: {
      businessId: business.id,
      applicationId,
      amount: amountInr,
      currency: "INR",
      status: "PENDING",
      transactionId: order.id,
    },
  });

  return {
    payment,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
  };
};

export const verifyRazorpayPayment = async (
  userId: string,
  body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
) => {
  if (!env.RAZORPAY_KEY_SECRET) {
    throw new AppError("Razorpay is not configured", 503);
  }

  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
    .digest("hex");

  if (expected !== body.razorpay_signature) {
    throw new AppError("Invalid payment signature", 400);
  }

  const business = await prisma.business.findUnique({ where: { userId } });
  if (!business) throw new AppError("Business profile required", 403);

  const payment = await prisma.payment.findFirst({
    where: {
      transactionId: body.razorpay_order_id,
      businessId: business.id,
    },
    include: {
      application: { include: { student: { include: { user: true } } } },
    },
  });
  if (!payment) throw new AppError("Payment not found", 404);

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "HELD",
      transactionId: body.razorpay_payment_id,
      processedAt: new Date(),
    },
  });

  if (payment.application?.student.userId) {
    getIO()
      .to(payment.application.student.userId)
      .emit("payment_received", updated);
  }

  return updated;
};
