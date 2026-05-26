"use client";

import { useAuth } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { useClerkSync } from "@/hooks/useClerkSync";
import { api } from "@/lib/api";

type CareerAdvice = {
  gigRecommendations: string[];
  skillSuggestions: string[];
  earningsInsights: string[];
  growthPath: string[];
};

export default function CareerAssistant() {
  const { isSignedIn } = useAuth();
  const { token, syncing } = useClerkSync("STUDENT");
  const [advice, setAdvice] = useState<CareerAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !token || syncing) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api<{ advice: CareerAdvice }>("/api/ai/career", {
          token,
        });
        setAdvice(data.advice);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load AI advice");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isSignedIn, token, syncing]);

  if (!isSignedIn) {
    return (
      <p className="text-muted-foreground text-sm">
        Sign in to get personalized career guidance from WorkBee AI.
      </p>
    );
  }

  if (loading || syncing) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Sparkles className="w-4 h-4 animate-pulse text-primary" />
        Analyzing your profile...
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (!advice) return null;

  const sections = [
    { title: "Recommended gigs", items: advice.gigRecommendations },
    { title: "Skills to build", items: advice.skillSuggestions },
    { title: "Earnings insights", items: advice.earningsInsights },
    { title: "Growth path", items: advice.growthPath },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((section) => (
        <div
          key={section.title}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {section.title}
          </h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {section.items.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
