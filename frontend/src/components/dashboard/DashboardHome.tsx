"use client";

import { motion } from "framer-motion";
import { Briefcase, TrendingUp, Clock, DollarSign, Calendar, Zap, Award, MapPin } from "lucide-react";

const stats = [
  { label: "Active Applications", value: "12", change: "+3 this week", icon: Briefcase, color: "text-primary" },
  { label: "Profile Views", value: "847", change: "+23% vs last week", icon: TrendingUp, color: "text-green-400" },
  { label: "Hours Worked", value: "156", change: "+12 this month", icon: Clock, color: "text-blue-400" },
  { label: "Total Earned", value: "$4,280", change: "+$520 this month", icon: DollarSign, color: "text-yellow-400" },
];

const upcomingGigs = [
  { title: "Website Redesign", client: "Local Cafe", date: "May 26, 2026", time: "2:00 PM", payment: "$300" },
  { title: "Logo Design", client: "Startup XYZ", date: "May 28, 2026", time: "10:00 AM", payment: "$150" },
  { title: "Content Writing", client: "Blog Network", date: "May 30, 2026", time: "Flexible", payment: "$200" },
];

export default function DashboardHome() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Welcome back, Alex</h1>
          <p className="text-muted-foreground text-lg">
            Here's what's happening with your gigs today.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass rounded-2xl p-6 smooth-transition hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-muted/50 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Zap className="w-4 h-4 text-primary opacity-50" />
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
                <div className="text-xs text-green-400">{stat.change}</div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold mb-1">Activity Overview</h2>
                <p className="text-sm text-muted-foreground">Your recent platform activity and gig performance.</p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">This Week</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-muted/30 p-4">
                <div className="text-sm text-muted-foreground mb-2">Most viewed gig</div>
                <div className="text-xl font-semibold">Brand identity update</div>
              </div>
              <div className="rounded-2xl bg-muted/30 p-4">
                <div className="text-sm text-muted-foreground mb-2">Conversion rate</div>
                <div className="text-xl font-semibold">82%</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Upcoming Gigs</h2>
            </div>
            <div className="space-y-4">
              {upcomingGigs.map((gig, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 smooth-transition cursor-pointer"
                >
                  <div className="font-semibold mb-1">{gig.title}</div>
                  <div className="text-sm text-muted-foreground mb-2">{gig.client}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{gig.date} • {gig.time}</span>
                    <span className="text-primary font-semibold">{gig.payment}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Recommendations</h2>
            </div>
            <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">Smart Match</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 smooth-transition cursor-pointer">
              <div className="font-semibold mb-2">New gig proposal</div>
              <div className="text-sm text-muted-foreground">A local startup is looking for a landing page redesign.</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 smooth-transition cursor-pointer">
              <div className="font-semibold mb-2">Boost your profile</div>
              <div className="text-sm text-muted-foreground">Complete 3 more projects this week to get featured.</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
