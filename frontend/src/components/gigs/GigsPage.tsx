"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";

export default function GigsPage() {
  const stats = [
    { value: "50K+", label: "Active Users" },
    { value: "12K+", label: "Jobs Posted" },
    { value: "98%", label: "Success Rate" },
    { value: "$2.5M+", label: "Paid Out" },
  ];

  const recommendedGigs = [
    {
      title: "Barista - Morning Shift",
      tag: "Urgent",
      match: "95%",
    },
    {
      title: "Event Setup Assistant",
      tag: "Popular",
      match: "89%",
    },
    {
      title: "Delivery Driver",
      tag: "Flexible",
      match: "87%",
    },
  ];

  const yourStats = {
    reputation: 4.9,
    completed: "$3,247",
    gigsDone: 34,
  };

  return (
    <section className="min-h-screen pt-24 pb-32 px-4 md:px-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-primary/80 mb-2">Find the perfect gig</p>
              <h1 className="text-4xl md:text-5xl font-bold">Browse local gigs matched to your profile</h1>
            </div>
            <div className="rounded-2xl bg-muted/30 p-4 text-sm text-muted-foreground">
              Updated 2 minutes ago
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="glass rounded-3xl p-6 text-center"
            >
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass rounded-3xl overflow-hidden border border-border"
          >
            <div className="bg-muted/50 px-4 py-3 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-sm text-muted-foreground">Recommended Gigs</div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Recommended Gigs</h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  AI Matched
                </div>
              </div>

              <div className="space-y-4">
                {recommendedGigs.map((gig, index) => (
                  <motion.div
                    key={gig.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.08 }}
                    className="flex items-center justify-between p-4 rounded-3xl bg-muted/30 hover:bg-muted/50 smooth-transition cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-3xl bg-primary/10 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-primary"></div>
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {gig.title}
                          {gig.tag && (
                            <span className="px-2 py-1 text-[0.65rem] uppercase tracking-[0.15em] rounded-full bg-primary text-background font-semibold">
                              {gig.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-primary font-semibold">{gig.match}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-3xl p-6 border border-border"
          >
            <h2 className="text-2xl font-semibold mb-6">Your Stats</h2>
            <div className="space-y-6">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Reputation</div>
                <div className="text-3xl font-bold">{yourStats.reputation}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Completed</div>
                <div className="text-3xl font-bold">{yourStats.completed}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Gigs Done</div>
                <div className="text-3xl font-bold">{yourStats.gigsDone}</div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-2">
                <TrendingUp className="w-4 h-4" />
                AI Insights
              </div>
              <p className="text-sm text-muted-foreground">
                You're in the top 10% of workers this month. Keep your profile active to stay featured.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
