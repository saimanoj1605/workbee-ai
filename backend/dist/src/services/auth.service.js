"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const db_1 = __importDefault(require("../config/db"));
const AppError_1 = require("../utils/AppError");
const hashing_1 = require("../utils/hashing");
const jwt_1 = require("../utils/jwt");
const auth_validator_1 = require("../validators/auth.validator");
const publicUserSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    isEmailVerified: true,
    createdAt: true,
};
const signup = async (body) => {
    const data = auth_validator_1.signupSchema.parse(body);
    const existing = await db_1.default.user.findUnique({
        where: { email: data.email },
    });
    if (existing) {
        throw new AppError_1.AppError("User already exists", 400);
    }
    if (data.role === "BUSINESS" && !data.businessName) {
        throw new AppError_1.AppError("businessName is required for business accounts", 400);
    }
    const passwordHash = await (0, hashing_1.hashPassword)(data.password);
    const user = await db_1.default.$transaction(async (tx) => {
        const created = await tx.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                passwordHash,
                role: data.role,
            },
            select: publicUserSelect,
        });
        if (data.role === "STUDENT") {
            await tx.student.create({ data: { userId: created.id } });
            await tx.reputationScore.create({ data: { userId: created.id } });
        }
        if (data.role === "BUSINESS") {
            await tx.business.create({
                data: {
                    userId: created.id,
                    businessName: data.businessName,
                },
            });
        }
        return created;
    });
    const token = (0, jwt_1.generateToken)(user.id);
    return { token, user };
};
exports.signup = signup;
const login = async (body) => {
    const { email, password } = auth_validator_1.loginSchema.parse(body);
    const user = await db_1.default.user.findUnique({ where: { email } });
    if (!user) {
        throw new AppError_1.AppError("Invalid credentials", 400);
    }
    if (!user.passwordHash) {
        throw new AppError_1.AppError("Use Clerk sign-in for this account", 400);
    }
    const isMatch = await (0, hashing_1.comparePassword)(password, user.passwordHash);
    if (!isMatch) {
        throw new AppError_1.AppError("Invalid credentials", 400);
    }
    const token = (0, jwt_1.generateToken)(user.id);
    const safeUser = await db_1.default.user.findUnique({
        where: { id: user.id },
        select: publicUserSelect,
    });
    return { token, user: safeUser };
};
exports.login = login;
