"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = void 0;
const db_1 = __importDefault(require("../config/db"));
const socket_1 = require("../config/socket");
const AppError_1 = require("../utils/AppError");
const review_validator_1 = require("../validators/review.validator");
const reputation_service_1 = require("./reputation.service");
const levelFromScore = (score) => {
    if (score >= 4.5)
        return "PLATINUM";
    if (score >= 4)
        return "GOLD";
    if (score >= 3)
        return "SILVER";
    if (score >= 2)
        return "BRONZE";
    return "NEW";
};
const createReview = async (userId, body) => {
    const data = review_validator_1.createReviewSchema.parse(body);
    if (data.receiverId === userId) {
        throw new AppError_1.AppError("You cannot review yourself", 400);
    }
    const receiver = await db_1.default.user.findUnique({
        where: { id: data.receiverId },
    });
    if (!receiver) {
        throw new AppError_1.AppError("Receiver not found", 404);
    }
    const review = await db_1.default.$transaction(async (tx) => {
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
    await (0, reputation_service_1.refreshReputation)(data.receiverId);
    (0, socket_1.getIO)().to(data.receiverId).emit("new_review", review);
    return review;
};
exports.createReview = createReview;
