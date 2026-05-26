import prisma from "../config/db";
import { AppError } from "../utils/AppError";

export const getConversationMessages = async (
  userId: string,
  peerId: string,
  limit = 100
) => {
  if (!peerId) throw new AppError("peerId is required", 400);
  const messages = await prisma.message.findMany({
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

