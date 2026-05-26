"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const env_1 = require("../config/env");
const AppError_1 = require("../utils/AppError");
const protect = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = typeof authHeader === "string"
            ? authHeader.split(" ")[1]
            : undefined;
        if (!token) {
            throw new AppError_1.AppError("Unauthorized", 401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await db_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true },
        });
        if (!user) {
            throw new AppError_1.AppError("User not found", 401);
        }
        req.userId = user.id;
        req.userRole = user.role;
        next();
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            return next(error);
        }
        next(new AppError_1.AppError("Invalid token", 401));
    }
};
exports.protect = protect;
