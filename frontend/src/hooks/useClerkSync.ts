"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";

const TOKEN_KEY = "workbee_token";
const ROLE_KEY = "workbee_role";

export function useClerkSync(role: "STUDENT" | "BUSINESS" = "STUDENT") {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !user) return;

    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      return;
    }

    const sync = async () => {
      setSyncing(true);
      try {
        const result = await api<{
          token: string;
          user: { id: string; role: string };
        }>("/api/auth/clerk/sync", {
          method: "POST",
          body: {
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            fullName: user.fullName ?? user.firstName ?? "WorkBee User",
            role,
            businessName:
              role === "BUSINESS"
                ? user.fullName ?? "My Business"
                : undefined,
          },
        });
        localStorage.setItem(TOKEN_KEY, result.token);
        localStorage.setItem(ROLE_KEY, result.user.role);
        setToken(result.token);
      } catch (err) {
        console.error("Clerk sync failed", err);
      } finally {
        setSyncing(false);
      }
    };

    sync();
  }, [isSignedIn, user, role]);

  const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    setToken(null);
  };

  return { token, syncing, clearToken };
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
