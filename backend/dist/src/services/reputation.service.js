"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementMetric = exports.refreshReputation = void 0;
const reputation_1 = require("../ai/reputation");
const db_1 = __importDefault(require("../config/db"));
const levelFromWis = (wis) => {
    if (wis >= 80)
        return "PLATINUM";
    if (wis >= 60)
        return "GOLD";
    if (wis >= 40)
        return "SILVER";
    if (wis >= 20)
        return "BRONZE";
    return "NEW";
};
const refreshReputation = async (userId) => {
    const rep = await db_1.default.reputationScore.findUnique({ where: { userId } });
    const metrics = {
        totalCompleted: rep?.totalCompleted ?? 0,
        punctualityCount: rep?.punctualityCount ?? 0,
        positiveReviews: rep?.positiveReviews ?? 0,
        cancellations: rep?.cancellations ?? 0,
        noShows: rep?.noShows ?? 0,
        fakeReports: rep?.fakeReports ?? 0,
    };
    const workIdentityScore = (0, reputation_1.calculateWorkIdentityScore)(metrics);
    const reliabilityScore = (0, reputation_1.calculateReliabilityScore)(workIdentityScore);
    const fraudStatus = (0, reputation_1.detectFraudFromMetrics)(metrics);
    return db_1.default.reputationScore.upsert({
        where: { userId },
        create: {
            userId,
            workIdentityScore,
            reliabilityScore,
            fraudStatus,
            level: levelFromWis(workIdentityScore),
            score: reliabilityScore / 20,
        },
        update: {
            workIdentityScore,
            reliabilityScore,
            fraudStatus,
            level: levelFromWis(workIdentityScore),
        },
    });
};
exports.refreshReputation = refreshReputation;
const incrementMetric = async (userId, field, amount = 1) => {
    await db_1.default.reputationScore.upsert({
        where: { userId },
        create: { userId, [field]: amount },
        update: { [field]: { increment: amount } },
    });
    return (0, exports.refreshReputation)(userId);
};
exports.incrementMetric = incrementMetric;
