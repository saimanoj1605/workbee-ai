"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Briefcase,
  Calendar,
  Target,
  Zap,
  Award,
  MapPin,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

import { api } from "@/lib/api";
import { useClerkSync } from "@/hooks/useClerkSync";

type QuickStat = { label: string; value: string; change: string; color: string };
type RecommendedJob = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  match: number;
  type: string;
  posted: string;
};

type DashboardResponse = {
  fullName: string;
  role: string;
  quickStats: QuickStat[];
  analyticsData: { name: string; applications: number }[];
  upcomingGigs: { title: string; client: string; date: string; time: string; payment: string; status: string }[];
  recommendedJobs: RecommendedJob[];
};

export default function StudentDashboard() {
  const { token, syncing } = useClerkSync("STUDENT");
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (syncing) return;
    if (!token) {
      setLoading(false);
      setError("Not signed in");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await api<DashboardResponse>("/api/dashboard", {
          method: "GET",
          token,
        });
        setDashboard(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, syncing]);

  const stats = dashboard?.quickStats ?? [];
  const analyticsData = dashboard?.analyticsData ?? [];
  const recommendedJobs = dashboard?.recommendedJobs ?? [];
  const upcomingGigs = dashboard?.upcomingGigs ?? [];

  return (
    <div className="min-h-screen pt-24 pb-32 md:pb-20 px-4 md:px-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Welcome back, {dashboard?.fullName ?? "there"}</h1>
          <p className="text-muted-foreground text-lg">Here's what's happening with your gigs today</p>
          <Link href="/dashboard/ai" className="inline-flex mt-4 items-center gap-2 text-sm font-medium text-primary hover:underline">
            <Zap className="w-4 h-4" />
            Open AI Career Assistant
          </Link>
        </motion.div>

        {loading && (
          <div className="rounded-3xl bg-muted/30 p-8 text-center text-muted-foreground">Loading dashboard...</div>
        )}

        {error && (
          <div className="rounded-3xl bg-red-500/10 border border-red-500/20 p-6 text-red-700 mb-8">{error}</div>
        )}

        {!loading && !error && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              {stats.map((stat, index) => {
                return (
                  <motion.div key={`${stat.label}-${index}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + index * 0.05 }} whileHover={{ y: -4, scale: 1.01 }} className="glass rounded-2xl p-6 smooth-transition hover:shadow-xl hover:shadow-primary/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-muted/50 ${stat.color}`}>
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <Zap className="w-4 h-4 text-primary opacity-50" />
                    </div>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
                    <div className="text-xs text-muted-foreground">{stat.change}</div>
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-1">Activity Overview</h2>
                    <p className="text-sm text-muted-foreground">Your weekly performance metrics</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">This Week</div>
                </div>

                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analyticsData.length ? analyticsData : [{ name: "No data", applications: 0 }] }>
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                    <Line type="monotone" dataKey="applications" stroke="#F5B700" strokeWidth={3} dot={{ fill: "#F5B700", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>

                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-sm text-muted-foreground">Applications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary-glow"></div>
                    <span className="text-sm text-muted-foreground">Profile Views</span>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Upcoming Gigs</h2>
                </div>

                <div className="space-y-4">
                  {upcomingGigs.length ? (
                    upcomingGigs.map((gig, index) => (
                      <motion.div key={`${gig.title}-${index}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + index * 0.1 }} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 smooth-transition cursor-pointer">
                        <div className="font-semibold mb-1">{gig.title}</div>
                        <div className="text-sm text-muted-foreground mb-2">{gig.client}</div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{gig.date} • {gig.time}</span>
                          <span className="text-primary font-semibold">{gig.payment}</span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-muted/20 p-4 text-sm text-muted-foreground">No upcoming gigs</div>
                  )}
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-semibold">AI-Powered Recommendations</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Perfect matches based on your skills and preferences</p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">AI Matched</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedJobs.length ? (
                  recommendedJobs.map((job, index) => (
                    <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + index * 0.1 }} whileHover={{ y: -4, scale: 1.01 }} className="p-6 rounded-xl bg-muted/30 hover:bg-muted/50 smooth-transition cursor-pointer border border-border/50 hover:border-primary/30">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">{job.match}%</div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-background/50 text-xs"><MapPin className="w-3 h-3" />{job.location ?? "Remote"}</div>
                        <div className="px-3 py-1 rounded-lg bg-background/50 text-xs">{job.type}</div>
                        <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold"><DollarSign className="w-3 h-3" />Negotiable</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Posted {job.posted}</span>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium smooth-transition hover:shadow-lg hover:shadow-primary/30">Apply Now</motion.button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-muted/20 p-4 text-sm text-muted-foreground">No recommendations yet</div>
                )}
              </div>

              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} whileHover={{ scale: 1.02 }} className="w-full mt-6 py-4 rounded-xl glass hover:bg-muted/50 smooth-transition font-medium">View All Recommendations</motion.button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
