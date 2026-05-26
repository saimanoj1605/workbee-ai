import { z } from "zod";

export const createReviewSchema = z.object({
  receiverId: z.string().uuid(),
  gigId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).optional(),
});
