"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const db_1 = __importDefault(require("../config/db"));
const AppError_1 = require("../utils/AppError");
const profile_validator_1 = require("../validators/profile.validator");
const getProfile = async (userId) => {
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        include: {
            student: true,
            business: true,
            reputation: true,
        },
    });
    if (!user) {
        throw new AppError_1.AppError("User not found", 404);
    }
    return user;
};
exports.getProfile = getProfile;
const updateProfile = async (userId, payload) => {
    const data = profile_validator_1.updateProfileSchema.parse(payload);
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (!user) {
        throw new AppError_1.AppError("User not found", 404);
    }
    return db_1.default.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                fullName: data.fullName ?? undefined,
            },
        });
        if (user.role === "STUDENT") {
            await tx.student.upsert({
                where: { userId },
                create: {
                    userId,
                    headline: data.headline ?? "",
                    bio: data.bio ?? "",
                    skills: data.skills ?? [],
                    education: data.education ?? "",
                    location: data.location ?? "",
                    portfolioUrl: data.portfolioUrl ?? "",
                    availability: data.availability ?? "",
                    latitude: data.latitude,
                    longitude: data.longitude,
                },
                update: {
                    headline: data.headline ?? undefined,
                    bio: data.bio ?? undefined,
                    skills: data.skills ?? undefined,
                    education: data.education ?? undefined,
                    location: data.location ?? undefined,
                    portfolioUrl: data.portfolioUrl ?? undefined,
                    availability: data.availability ?? undefined,
                    latitude: data.latitude,
                    longitude: data.longitude,
                },
            });
        }
        if (user.role === "BUSINESS") {
            await tx.business.upsert({
                where: { userId },
                create: {
                    userId,
                    businessName: data.businessName ?? "",
                    about: data.about ?? "",
                    website: data.website ?? "",
                    industry: data.industry ?? "",
                    location: data.location ?? "",
                },
                update: {
                    businessName: data.businessName ?? undefined,
                    about: data.about ?? undefined,
                    website: data.website ?? undefined,
                    industry: data.industry ?? undefined,
                    location: data.location ?? undefined,
                },
            });
        }
        return tx.user.findUnique({
            where: { id: userId },
            include: {
                student: true,
                business: true,
                reputation: true,
            },
        });
    });
};
exports.updateProfile = updateProfile;
