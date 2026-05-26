import type { UserRole } from "@prisma/client";

import prisma from "../config/db";
import { AppError } from "../utils/AppError";
import { comparePassword, hashPassword } from "../utils/hashing";
import { generateToken } from "../utils/jwt";
import { loginSchema, signupSchema } from "../validators/auth.validator";

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isEmailVerified: true,
  createdAt: true,
};

export const signup = async (body: unknown) => {
  const data = signupSchema.parse(body);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new AppError("User already exists", 400);
  }

  if (data.role === "BUSINESS" && !data.businessName) {
    throw new AppError("businessName is required for business accounts", 400);
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        role: data.role as UserRole,
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
          businessName: data.businessName!,
        },
      });
    }

    return created;
  });

  const token = generateToken(user.id);
  return { token, user };
};

export const login = async (body: unknown) => {
  const { email, password } = loginSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid credentials", 400);
  }

    if (!user.passwordHash) {
      throw new AppError("Use Clerk sign-in for this account", 400);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 400);
    }

  const token = generateToken(user.id);
  const safeUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: publicUserSelect,
  });

  return { token, user: safeUser };
};
