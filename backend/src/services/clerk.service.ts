import type { UserRole } from "@prisma/client";

import prisma from "../config/db";
import { AppError } from "../utils/AppError";
import { generateToken } from "../utils/jwt";
import { refreshReputation } from "./reputation.service";

export type ClerkSyncInput = {
  clerkId: string;
  email: string;
  fullName: string;
  role: UserRole;
  businessName?: string;
};

export const syncClerkUser = async (input: ClerkSyncInput) => {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ clerkId: input.clerkId }, { email: input.email }],
    },
  });

  if (existing) {
    const user = await prisma.user.update({
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
    const token = generateToken(user.id);
    return { token, user, isNew: false };
  }

  if (input.role === "BUSINESS" && !input.businessName) {
    throw new AppError("businessName required for business accounts", 400);
  }

  const user = await prisma.$transaction(async (tx) => {
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
          businessName: input.businessName!,
        },
      });
    }

    return created;
  });

  await refreshReputation(user.id);
  const token = generateToken(user.id);
  return { token, user, isNew: true };
};
