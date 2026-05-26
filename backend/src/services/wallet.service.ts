import prisma from "../config/db";
import { getIO } from "../config/socket";
import { AppError } from "../utils/AppError";

// ============================================
// WALLET MANAGEMENT
// ============================================

/**
 * Get or create a wallet for a user
 */
export const getOrCreateWallet = async (userId: string) => {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
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

/**
 * Get wallet balance for a user
 */
export const getWalletBalance = async (userId: string) => {
  const wallet = await getOrCreateWallet(userId);
  return {
    balance: wallet.balance,
    pendingBalance: wallet.pendingBalance,
    totalBalance: wallet.balance + wallet.pendingBalance,
    isKycVerified: wallet.kycVerified,
  };
};

/**
 * Add funds to wallet (for student earnings)
 */
export const addFundsToWallet = async (
  userId: string,
  amount: number,
  description: string,
  paymentId?: string,
  referenceId?: string
) => {
  const wallet = await getOrCreateWallet(userId);

  if (wallet.status !== "ACTIVE") {
    throw new AppError("Wallet is not active", 400);
  }

  const balanceBefore = wallet.balance;

  // Create transaction record
  const transaction = await prisma.transaction.create({
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
  const updatedWallet = await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: {
        increment: amount,
      },
    },
  });

  // Emit real-time update
  getIO().to(userId).emit("wallet_updated", {
    balance: updatedWallet.balance,
    transaction,
  });

  return { wallet: updatedWallet, transaction };
};

/**
 * Deduct funds from wallet (for withdrawals, fees)
 */
export const deductFromWallet = async (
  userId: string,
  amount: number,
  description: string,
  type: "WITHDRAWAL" | "ADJUSTMENT" = "WITHDRAWAL"
) => {
  const wallet = await getOrCreateWallet(userId);

  if (wallet.status !== "ACTIVE") {
    throw new AppError("Wallet is not active", 400);
  }

  if (wallet.balance < amount) {
    throw new AppError("Insufficient wallet balance", 400);
  }

  const balanceBefore = wallet.balance;

  // Create transaction record
  const transaction = await prisma.transaction.create({
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
  const updatedWallet = await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: {
        decrement: amount,
      },
    },
  });

  // Emit real-time update
  getIO().to(userId).emit("wallet_updated", {
    balance: updatedWallet.balance,
    transaction,
  });

  return { wallet: updatedWallet, transaction };
};

/**
 * Get wallet transaction history
 */
export const getWalletTransactions = async (
  userId: string,
  page: number = 1,
  limit: number = 20,
  type?: string
) => {
  const wallet = await getOrCreateWallet(userId);

  const where: any = { walletId: wallet.id };
  if (type) {
    where.type = type;
  }

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
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
    prisma.transaction.count({ where }),
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

/**
 * Update KYC status for wallet
 */
export const updateWalletKYC = async (
  userId: string,
  kycData: {
    panNumber?: string;
    aadhaarNumber?: string;
    bankAccount?: string;
    ifscCode?: string;
  }
) => {
  const wallet = await getOrCreateWallet(userId);

  const updatedWallet = await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      kycVerified: true,
      kycData: {
        ...((wallet.kycData as any) || {}),
        ...kycData,
      },
    },
  });

  return updatedWallet;
};

/**
 * Freeze or unfreeze wallet
 */
export const toggleWalletStatus = async (
  userId: string,
  status: "ACTIVE" | "FROZEN" | "CLOSED"
) => {
  const wallet = await getOrCreateWallet(userId);

  return prisma.wallet.update({
    where: { id: wallet.id },
    data: { status },
  });
};