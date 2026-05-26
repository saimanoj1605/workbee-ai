import { z } from "zod";

export const createPaymentSchema = z.object({
  applicationId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
});

export const releasePaymentSchema = z.object({
  paymentId: z.string().uuid(),
});
