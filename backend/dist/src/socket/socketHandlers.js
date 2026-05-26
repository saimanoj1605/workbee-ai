"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocketHandlers = void 0;
const db_1 = __importDefault(require("../config/db"));
const socket_1 = require("../config/socket");
// In-memory presence tracking (sufficient for MVP; move to Redis for scale later)
const onlineUsers = new Map();
const joinUserRooms = (socket, userId) => {
    // Backward compatibility with previous emission code: room = raw userId
    socket.join(userId);
    socket.join(`user:${userId}`);
};
const addOnline = (userId, socketId) => {
    const set = onlineUsers.get(userId) ?? new Set();
    set.add(socketId);
    onlineUsers.set(userId, set);
};
const removeOnline = (userId, socketId) => {
    const set = onlineUsers.get(userId);
    if (!set)
        return;
    set.delete(socketId);
    if (set.size === 0)
        onlineUsers.delete(userId);
};
const isUserOnline = (userId) => onlineUsers.has(userId);
const bucketFromCoords = (lat, lng) => {
    // 2-decimal bucket (~1km-ish depending on latitude)
    const bLat = Math.round(lat * 100) / 100;
    const bLng = Math.round(lng * 100) / 100;
    return `${bLat},${bLng}`;
};
const registerSocketHandlers = (io) => {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        // --- Presence & Rooms ---
        socket.on("join", (userId) => {
            if (typeof userId !== "string" || userId.length === 0)
                return;
            socket.data.userId = userId;
            joinUserRooms(socket, userId);
            addOnline(userId, socket.id);
            io.to("admin").emit("presence_update", {
                userId,
                online: true,
            });
        });
        socket.on("join-location", (payload) => {
            if (typeof payload === "string") {
                socket.join(`geo:${payload}`);
                return;
            }
            const { latitude, longitude } = payload;
            if (typeof latitude !== "number" ||
                typeof longitude !== "number") {
                return;
            }
            const bucket = bucketFromCoords(latitude, longitude);
            socket.join(`geo:${bucket}`);
        });
        socket.on("admin:subscribe", () => {
            socket.join("admin");
        });
        // --- Chat ---
        socket.on("send_message", async (payload, ack) => {
            try {
                const senderId = socket.data.userId;
                if (!senderId) {
                    ack?.({ ok: false, error: "Not joined" });
                    return;
                }
                if (!payload ||
                    typeof payload.receiverId !== "string" ||
                    typeof payload.content !== "string" ||
                    payload.content.trim().length === 0) {
                    ack?.({ ok: false, error: "Invalid payload" });
                    return;
                }
                const message = await db_1.default.message.create({
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
                (0, socket_1.getIO)()
                    .to(payload.receiverId)
                    .emit("new_message", message);
                (0, socket_1.getIO)()
                    .to(`user:${payload.receiverId}`)
                    .emit("new_message", message);
                ack?.({ ok: true, messageId: message.id });
            }
            catch (e) {
                console.error(e);
                ack?.({ ok: false, error: "Failed to send message" });
            }
        });
        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
            const userId = socket.data.userId;
            if (!userId)
                return;
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
exports.registerSocketHandlers = registerSocketHandlers;
