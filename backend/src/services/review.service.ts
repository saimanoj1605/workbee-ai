import type { ReputationLevel } from "@prisma/client";

import prisma from "../config/db";
import { getIO } from "../config/socket";
import { AppError } from "../utils/AppError";
import { createReviewSchema } from "../validators/review.validator";
import { refreshReputation } from "./reputation.service";

const levelFromScore = (score: number): ReputationLevel => {
  if (score >= 4.5) return "PLATINUM";
  if (score >= 4) return "GOLD";
  if (score >= 3) return "SILVER";
  if (score >= 2) return "BRONZE";
  return "NEW";
};

export const createReview = async (userId: string, body: unknown) => {
  const data = createReviewSchema.parse(body);

  if (data.receiverId === userId) {
    throw new AppError("You cannot review yourself", 400);
  }

  const receiver = await prisma.user.findUnique({
    where: { id: data.receiverId },
  });
  if (!receiver) {
    throw new AppError("Receiver not found", 404);
  }

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        authorId: userId,
        receiverId: data.receiverId,
        gigId: data.gigId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        author: { select: { id: true, fullName: true } },
        receiver: { select: { id: true, fullName: true } },
      },
    });

    const agg = await tx.review.aggregate({
      where: { receiverId: data.receiverId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const avgScore = agg._avg.rating ?? data.rating;
    const reviewCount = agg._count.rating;

    await tx.reputationScore.upsert({
      where: { userId: data.receiverId },
      create: {
        userId: data.receiverId,
        score: avgScore,
        reviewCount,
        level: levelFromScore(avgScore),
        positiveReviews: data.rating >= 4 ? 1 : 0,
      },
      update: {
        score: avgScore,
        reviewCount,
        level: levelFromScore(avgScore),
        ...(data.rating >= 4
          ? { positiveReviews: { increment: 1 } }
          : {}),
      },
    });

    return created;
  });

  await refreshReputation(data.receiverId);

  getIO().to(data.receiverId).emit("new_review", review);

  return review;
};
