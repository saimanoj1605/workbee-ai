"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncClerkUser = void 0;
const db_1 = __importDefault(require("../config/db"));
const AppError_1 = require("../utils/AppError");
const jwt_1 = require("../utils/jwt");
const reputation_service_1 = require("./reputation.service");
const syncClerkUser = async (input) => {
    const existing = await db_1.default.user.findFirst({
        where: {
            OR: [{ clerkId: input.clerkId }, { email: input.email }],
        },
    });
    if (existing) {
        const user = await db_1.default.user.update({
            where: { id: existing.id },
            data: {
                clerkId: input.clerkId,
                fullName: input.fullName,
                isEmailVerified: true,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                clerkId: true,
            },
        });
        const token = (0, jwt_1.generateToken)(user.id);
        return { token, user, isNew: false };
    }
    if (input.role === "BUSINESS" && !input.businessName) {
        throw new AppError_1.AppError("businessName required for business accounts", 400);
    }
    const user = await db_1.default.$transaction(async (tx) => {
        const created = await tx.user.create({
            data: {
                clerkId: input.clerkId,
                fullName: input.fullName,
                email: input.email,
                role: input.role,
                isEmailVerified: true,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                clerkId: true,
            },
        });
        if (input.role === "STUDENT") {
            await tx.student.create({ data: { userId: created.id } });
        }
        if (input.role === "BUSINESS") {
            await tx.business.create({
                data: {
                    userId: created.id,
                    businessName: input.businessName,
                },
            });
        }
        return created;
    });
    await (0, reputation_service_1.refreshReputation)(user.id);
    const token = (0, jwt_1.generateToken)(user.id);
    return { token, user, isNew: true };
};
exports.syncClerkUser = syncClerkUser;
