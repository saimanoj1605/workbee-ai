"use client";

import { useAuth } from "@clerk/nextjs";
import { io } from "socket.io-client";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

import { API_URL } from "@/lib/api";
import { decodeUserIdFromToken } from "@/lib/decodeJwt";
import { useClerkSync } from "@/hooks/useClerkSync";

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

export default function ChatPage() {
  const searchParams = useSearchParams();
  const peerId = searchParams.get("peerId") ?? "";

  const { isSignedIn } = useAuth();
  const { token } = useClerkSync("STUDENT");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  const myUserId = useMemo(() => {
    if (!token) return null;
    return decodeUserIdFromToken(token);
  }, [token]);

  useEffect(() => {
    if (!isSignedIn || !token || !myUserId) return;
    if (socketRef.current) return;

    const socket = io(API_URL, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", myUserId);
    });

    socket.on("new_message", (message: ChatMessage) => {
      // Keep only messages between me <-> peerId
      if (!peerId) return;
      const involvesPeer =
        (message.senderId === myUserId && message.receiverId === peerId) ||
        (message.senderId === peerId && message.receiverId === myUserId);
      if (!involvesPeer) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [API_URL, isSignedIn, token, myUserId, peerId]);

  const send = () => {
    if (!socketRef.current || !peerId || !myUserId) return;
    const text = content.trim();
    if (!text) return;

    socketRef.current.emit(
      "send_message",
      {
        receiverId: peerId,
        content: text,
      },
      (ack: any) => {
        if (!ack?.ok) toast.error(ack?.error ?? "Failed to send");
      }
    );
    setContent("");
  };

  return (
    <div className="min-h-screen pt-24 pb-10 px-4 md:px-6 bg-background text-foreground">
      <div className="max-w-3xl mx-auto glass rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-4">Live Chat</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Add your peer id in the URL like: <code>?peerId=USER_ID</code>
        </p>

        {!peerId ? (
          <p className="text-sm text-muted-foreground">
            Provide <code>peerId</code> to start chatting.
          </p>
        ) : (
          <>
            <div className="border border-border/60 rounded-xl p-3 h-96 overflow-y-auto bg-muted/20">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No messages yet. Say hi!
                </p>
              ) : (
                <ul className="space-y-2">
                  {messages.map((m) => {
                    const mine = m.senderId === myUserId;
                    return (
                      <li
                        key={m.id}
                        className={`p-3 rounded-xl max-w-[80%] ${
                          mine
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-background border border-border/60"
                        }`}
                      >
                        <div className="text-sm break-words">{m.content}</div>
                        <div className="text-[0.7rem] opacity-70 mt-1">
                          {new Date(m.createdAt).toLocaleTimeString()}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background"
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
              <button
                onClick={send}
                className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

