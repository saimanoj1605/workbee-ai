"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleWalletStatus = exports.updateWalletKYC = exports.getWalletTransactions = exports.deductFromWallet = exports.addFundsToWallet = exports.getWalletBalance = exports.getOrCreateWallet = void 0;
const db_1 = __importDefault(require("../config/db"));
const socket_1 = require("../config/socket");
const AppError_1 = require("../utils/AppError");
// ============================================
// WALLET MANAGEMENT
// ============================================
/**
 * Get or create a wallet for a user
 */
const getOrCreateWallet = async (userId) => {
    let wallet = await db_1.default.wallet.findUnique({
        where: { userId },
    });
    if (!wallet) {
        wallet = await db_1.default.wallet.create({
            data: {
                userId,
                balance: 0,
                pendingBalance: 0,
                status: "ACTIVE",
            },
        });
    }
    return wallet;
};
exports.getOrCreateWallet = getOrCreateWallet;
/**
 * Get wallet balance for a user
 */
const getWalletBalance = async (userId) => {
    const wallet = await (0, exports.getOrCreateWallet)(userId);
    return {
        balance: wallet.balance,
        pendingBalance: wallet.pendingBalance,
        totalBalance: wallet.balance + wallet.pendingBalance,
        isKycVerified: wallet.kycVerified,
    };
};
exports.getWalletBalance = getWalletBalance;
/**
 * Add funds to wallet (for student earnings)
 */
const addFundsToWallet = async (userId, amount, description, paymentId, referenceId) => {
    const wallet = await (0, exports.getOrCreateWallet)(userId);
    if (wallet.status !== "ACTIVE") {
        throw new AppError_1.AppError("Wallet is not active", 400);
    }
    const balanceBefore = wallet.balance;
    // Create transaction record
    const transaction = await db_1.default.transaction.create({
        data: {
            walletId: wallet.id,
            type: "DEPOSIT",
            amount,
            currency: "INR",
            status: "COMPLETED",
            razorpayId: paymentId,
            referenceId,
            description,
            balanceBefore,
            balanceAfter: balanceBefore + amount,
        },
    });
    // Update wallet balance
    const updatedWallet = await db_1.default.wallet.update({
        where: { id: wallet.id },
        data: {
            balance: {
                increment: amount,
            },
        },
    });
    // Emit real-time update
    (0, socket_1.getIO)().to(userId).emit("wallet_updated", {
        balance: updatedWallet.balance,
        transaction,
    });
    return { wallet: updatedWallet, transaction };
};
exports.addFundsToWallet = addFundsToWallet;
/**
 * Deduct funds from wallet (for withdrawals, fees)
 */
const deductFromWallet = async (userId, amount, description, type = "WITHDRAWAL") => {
    const wallet = await (0, exports.getOrCreateWallet)(userId);
    if (wallet.status !== "ACTIVE") {
        throw new AppError_1.AppError("Wallet is not active", 400);
    }
    if (wallet.balance < amount) {
        throw new AppError_1.AppError("Insufficient wallet balance", 400);
    }
    const balanceBefore = wallet.balance;
    // Create transaction record
    const transaction = await db_1.default.transaction.create({
        data: {
            walletId: wallet.id,
            type,
            amount,
            currency: "INR",
            status: "COMPLETED",
            description,
            balanceBefore,
            balanceAfter: balanceBefore - amount,
        },
    });
    // Update wallet balance
    const updatedWallet = await db_1.default.wallet.update({
        where: { id: wallet.id },
        data: {
            balance: {
                decrement: amount,
            },
        },
    });
    // Emit real-time update
    (0, socket_1.getIO)().to(userId).emit("wallet_updated", {
        balance: updatedWallet.balance,
        transaction,
    });
    return { wallet: updatedWallet, transaction };
};
exports.deductFromWallet = deductFromWallet;
/**
 * Get wallet transaction history
 */
const getWalletTransactions = async (userId, page = 1, limit = 20, type) => {
    const wallet = await (0, exports.getOrCreateWallet)(userId);
    const where = { walletId: wallet.id };
    if (type) {
        where.type = type;
    }
    const [transactions, total] = await db_1.default.$transaction([
        db_1.default.transaction.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                payment: {
                    select: {
                        id: true,
                        application: {
                            select: {
                                gig: {
                                    select: {
                                        title: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }),
        db_1.default.transaction.count({ where }),
    ]);
    return {
        transactions,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};
exports.getWalletTransactions = getWalletTransactions;
/**
 * Update KYC status for wallet
 */
const updateWalletKYC = async (userId, kycData) => {
    const wallet = await (0, exports.getOrCreateWallet)(userId);
    const updatedWallet = await db_1.default.wallet.update({
        where: { id: wallet.id },
        data: {
            kycVerified: true,
            kycData: {
                ...(wallet.kycData || {}),
                ...kycData,
            },
        },
    });
    return updatedWallet;
};
exports.updateWalletKYC = updateWalletKYC;
/**
 * Freeze or unfreeze wallet
 */
const toggleWalletStatus = async (userId, status) => {
    const wallet = await (0, exports.getOrCreateWallet)(userId);
    return db_1.default.wallet.update({
        where: { id: wallet.id },
        data: { status },
    });
};
exports.toggleWalletStatus = toggleWalletStatus;
