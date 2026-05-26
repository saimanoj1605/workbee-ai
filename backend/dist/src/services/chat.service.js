"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversationMessages = void 0;
const db_1 = __importDefault(require("../config/db"));
const AppError_1 = require("../utils/AppError");
const getConversationMessages = async (userId, peerId, limit = 100) => {
    if (!peerId)
        throw new AppError_1.AppError("peerId is required", 400);
    const messages = await db_1.default.message.findMany({
        where: {
            OR: [
                { senderId: userId, receiverId: peerId },
                { senderId: peerId, receiverId: userId },
            ],
        },
        orderBy: { createdAt: "asc" },
        take: limit,
    });
    return { messages };
};
exports.getConversationMessages = getConversationMessages;
