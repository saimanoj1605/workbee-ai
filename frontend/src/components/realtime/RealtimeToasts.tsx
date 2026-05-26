"use client";

import { useAuth } from "@clerk/nextjs";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useEffect, useMemo, useRef } from "react";

import { API_URL } from "@/lib/api";
import { decodeUserIdFromToken } from "@/lib/decodeJwt";
import { useClerkSync } from "@/hooks/useClerkSync";

const safeToast = (title: string, message?: string) => {
  toast(message ? `${title}: ${message}` : title);
};

export default function RealtimeToasts() {
  const { isSignedIn } = useAuth();
  const { token, syncing } = useClerkSync("STUDENT");
  const socketRef = useRef<Socket | null>(null);

  const userId = useMemo(() => {
    if (!token) return null;
    return decodeUserIdFromToken(token);
  }, [token]);

  useEffect(() => {
    if (!isSignedIn || !token || !userId) return;
    if (socketRef.current) return;

    const socket = io(API_URL, {
      transports: ["websocket"],
      autoConnect: true,
      auth: { token },
    }) as Socket;

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", userId);
      safeToast("Realtime connected");

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            socket.emit("join-location", {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          () => {
            // Location not available; geo alerts still work if your profile has coords.
          }
        );
      }
    });

    socket.on("gig_created", (payload: any) => {
      const gig = payload?.gig;
      const distanceKm = payload?.distanceKm;
      safeToast(
        "New gig alert",
        gig?.title ? `${gig.title}${distanceKm != null ? ` (${distanceKm.toFixed(1)} km)` : ""}` : undefined
      );
    });

    socket.on("application_received", (payload: any) => {
      const student = payload?.student;
      safeToast(
        "New application",
        student?.user?.fullName
          ? `From ${student.user.fullName}`
          : undefined
      );
    });

    socket.on("worker_accepted", (payload: any) => {
      safeToast("Worker accepted", `Gig ${payload?.gigId ?? ""}`);
    });

    socket.on("worker_rejected", () => {
      safeToast("Worker rejected");
    });

    socket.on("worker_status_updated", (payload: any) => {
      safeToast("Worker status", payload?.phase ?? "updated");
    });

    socket.on("gig_completed", () => {
      safeToast("Gig completed");
    });

    socket.on("worker_verified", (payload: any) => {
      const distanceKm = payload?.distanceKm;
      safeToast(
        "Work verified",
        distanceKm != null ? `${Number(distanceKm).toFixed(2)} km` : undefined
      );
    });

    socket.on("emergency_dispatch", (payload: any) => {
      const gig = payload?.gig;
      safeToast(
        "Emergency dispatch",
        gig?.title ? gig.title : undefined
      );
    });

    socket.on("new_message", (message: any) => {
      const mine = message?.receiverId === userId || message?.senderId === userId;
      if (!mine) return;
      safeToast("New message", message?.content ? String(message.content) : undefined);
    });

    socket.on("presence_update", (payload: any) => {
      // Admin monitoring only; ignore for normal users.
      void payload;
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [API_URL, isSignedIn, token, userId]);

  if (!isSignedIn || syncing) return null;
  return null;
}

