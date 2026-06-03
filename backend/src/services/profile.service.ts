import type { Prisma } from "@prisma/client";
import prisma from "../config/db";
import { AppError } from "../utils/AppError";
import { updateProfileSchema } from "../validators/profile.validator";

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: true,
      business: true,
      reputation: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const updateProfile = async (userId: string, payload: unknown) => {
  const data = updateProfileSchema.parse(payload);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return prisma.$transaction(async (tx) => {
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
