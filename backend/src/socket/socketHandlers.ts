import type { Socket, Server } from "socket.io";

import prisma from "../config/db";
import { getIO } from "../config/socket";

// In-memory presence tracking (sufficient for MVP; move to Redis for scale later)
const onlineUsers = new Map<string, Set<string>>();

const joinUserRooms = (socket: Socket, userId: string) => {
  // Backward compatibility with previous emission code: room = raw userId
  socket.join(userId);
  socket.join(`user:${userId}`);
};

const addOnline = (userId: string, socketId: string) => {
  const set = onlineUsers.get(userId) ?? new Set<string>();
  set.add(socketId);
  onlineUsers.set(userId, set);
};

const removeOnline = (userId: string, socketId: string) => {
  const set = onlineUsers.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineUsers.delete(userId);
};

const isUserOnline = (userId: string) => onlineUsers.has(userId);

const bucketFromCoords = (lat: number, lng: number) => {
  // 2-decimal bucket (~1km-ish depending on latitude)
  const bLat = Math.round(lat * 100) / 100;
  const bLng = Math.round(lng * 100) / 100;
  return `${bLat},${bLng}`;
};

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // --- Presence & Rooms ---
    socket.on("join", (userId: string) => {
      if (typeof userId !== "string" || userId.length === 0) return;

      socket.data.userId = userId;
      joinUserRooms(socket, userId);
      addOnline(userId, socket.id);

      io.to("admin").emit("presence_update", {
        userId,
        online: true,
      });
    });

    socket.on(
      "join-location",
      (payload: { latitude: number; longitude: number } | string) => {
        if (typeof payload === "string") {
          socket.join(`geo:${payload}`);
          return;
        }
        const { latitude, longitude } = payload;
        if (
          typeof latitude !== "number" ||
          typeof longitude !== "number"
        ) {
          return;
        }
        const bucket = bucketFromCoords(latitude, longitude);
        socket.join(`geo:${bucket}`);
      }
    );

    socket.on("admin:subscribe", () => {
      socket.join("admin");
    });

    // --- Chat ---
    socket.on(
      "send_message",
      async (
        payload: {
          receiverId: string;
          content: string;
          gigId?: string;
          applicationId?: string;
          imageUrl?: string;
        },
        ack?: (res: { ok: boolean; messageId?: string; error?: string }) => void
      ) => {
        try {
          const senderId = socket.data.userId as string | undefined;
          if (!senderId) {
            ack?.({ ok: false, error: "Not joined" });
            return;
          }

          if (
            !payload ||
            typeof payload.receiverId !== "string" ||
            typeof payload.content !== "string" ||
            payload.content.trim().length === 0
          ) {
            ack?.({ ok: false, error: "Invalid payload" });
            return;
          }

          const message = await prisma.message.create({
            data: {
              senderId,
              receiverId: payload.receiverId,
              content: payload.content.trim(),
              imageUrl: payload.imageUrl,
              gigId: payload.gigId,
              applicationId: payload.applicationId,
            },
          });

          // Send to receiver in both room naming styles
          getIO()
            .to(payload.receiverId)
            .emit("new_message", message);
          getIO()
            .to(`user:${payload.receiverId}`)
            .emit("new_message", message);

          ack?.({ ok: true, messageId: message.id });
        } catch (e) {
          console.error(e);
          ack?.({ ok: false, error: "Failed to send message" });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const userId = socket.data.userId as string | undefined;
      if (!userId) return;

      removeOnline(userId, socket.id);
      const online = isUserOnline(userId);
      if (!online) {
        io.to("admin").emit("presence_update", {
          userId,
          online: false,
        });
      }
    });
  });
};
