import Stripe from "stripe";

import prisma from "../config/db";
import { env } from "../config/env";
import { getIO } from "../config/socket";
import { AppError } from "../utils/AppError";
import {
  createPaymentSchema,
  releasePaymentSchema,
} from "../validators/payment.validator";

const getStripe = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError("Stripe is not configured", 503);
  }
  return new Stripe(env.STRIPE_SECRET_KEY);
};

export const createPayment = async (userId: string, body: unknown) => {
  const data = createPaymentSchema.parse(body);

  const business = await prisma.business.findUnique({ where: { userId } });
  if (!business) {
    throw new AppError("Business profile not found", 404);
  }

  const application = await prisma.application.findFirst({
    where: { id: data.applicationId },
    include: {
      gig: true,
      student: { include: { user: true } },
    },
  });

  if (!application || application.gig.businessId !== business.id) {
    throw new AppError("Application not found or access denied", 404);
  }

  if (application.status !== "HIRED") {
    throw new AppError("Payment requires a hired application", 400);
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

  const payment = await prisma.payment.create({
    data: {
      businessId: business.id,
      applicationId: data.applicationId,
      amount: data.amount,
      currency: data.currency,
      status: "PENDING",
      transactionId: paymentIntent.id,
    },
  });

  return {
    payment,
    clientSecret: paymentIntent.client_secret,
  };
};

export const confirmPaymentHeld = async (
  userId: string,
  paymentIntentId: string
) => {
  const business = await prisma.business.findUnique({ where: { userId } });
  if (!business) {
    throw new AppError("Business profile not found", 404);
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (
    intent.status !== "requires_capture" &&
    intent.status !== "succeeded"
  ) {
    throw new AppError("Payment not completed", 400);
  }

  const payment = await prisma.payment.findFirst({
    where: {
      transactionId: paymentIntentId,
      businessId: business.id,
    },
    include: {
      application: { include: { student: { include: { user: true } } } },
    },
  });

  if (!payment) {
    throw new AppError("Payment record not found", 404);
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "HELD",
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

export const releasePayment = async (userId: string, body: unknown) => {
  const { paymentId } = releasePaymentSchema.parse(body);

  const business = await prisma.business.findUnique({ where: { userId } });
  if (!business) {
    throw new AppError("Business profile not found", 404);
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, businessId: business.id },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.status !== "HELD") {
    throw new AppError("Only held payments can be released", 400);
  }

  if ((payment as any).transactionId && env.STRIPE_SECRET_KEY) {
    const stripe = getStripe();
    await stripe.paymentIntents.capture((payment as any).transactionId);
  }

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "RELEASED",
      processedAt: new Date(),
    },
  });
};
