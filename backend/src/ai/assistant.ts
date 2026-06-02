import OpenAI from "openai";

import { env } from "../config/env";

export type CareerContext = {
  fullName: string;
  skills: string[];
  totalCompleted: number;
  workIdentityScore: number;
  recentGigTitles: string[];
};

const getClient = () => {
  const apiKey = env.OPENAI_API_KEY || env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

export const buildCareerPrompt = (ctx: CareerContext): string => {
  return `You are WorkBee AI Career Assistant — a mentor for student gig workers.

Student: ${ctx.fullName}
Skills: ${ctx.skills.join(", ") || "None listed"}
Completed gigs: ${ctx.totalCompleted}
Work Identity Score: ${ctx.workIdentityScore}
Recent gigs: ${ctx.recentGigTitles.join(", ") || "None yet"}

Respond in JSON only with this shape:
{
  "gigRecommendations": ["..."],
  "skillSuggestions": ["..."],
  "earningsInsights": ["..."],
  "growthPath": ["..."]
}
Keep each array to 2-3 concise, actionable items.`;
};

export const getCareerAdvice = async (ctx: CareerContext) => {
  const client = getClient();

  if (!client) {
    return getFallbackAdvice(ctx);
  }

  try {
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You help students find gig work and grow skills. Always respond with valid JSON only.",
        },
        { role: "user", content: buildCareerPrompt(ctx) },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return getFallbackAdvice(ctx);
    return JSON.parse(content);
  } catch {
    return getFallbackAdvice(ctx);
  }
};

const getFallbackAdvice = (ctx: CareerContext) => ({
  gigRecommendations: [
    ctx.skills.length
      ? `Apply to gigs needing ${ctx.skills.slice(0, 2).join(" & ")} near you.`
      : "Browse open campus and delivery gigs in your area.",
    "Filter gigs marked OPEN with fewer than 5 applicants for better odds.",
  ],
  skillSuggestions: [
    "Add Excel or customer service to unlock higher-paying event gigs.",
    "Complete your profile bio and portfolio link to stand out.",
  ],
  earningsInsights: [
    "Weekend shifts often pay 30–40% more than weekday gigs.",
    `You're ${Math.max(0, 5 - ctx.totalCompleted)} gigs away from a stronger Work Identity Score.`,
  ],
  growthPath: [
    ctx.totalCompleted < 5
      ? "Complete 5 gigs to unlock premium job recommendations."
      : "Maintain 4.5+ ratings to reach GOLD reputation tier.",
    "Enable availability as 'immediate' to rank higher in AI matching.",
  ],
});
