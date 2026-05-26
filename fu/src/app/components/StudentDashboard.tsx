import { motion } from "motion/react";
import {
  Briefcase,
  TrendingUp,
  Clock,
  DollarSign,
  MapPin,
  Star,
  Calendar,
  Target,
  Zap,
  Award,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";

export default function StudentDashboard() {
  const analyticsData = [
    { name: "Mon", applications: 4, views: 12 },
    { name: "Tue", applications: 6, views: 18 },
    { name: "Wed", applications: 8, views: 24 },
    { name: "Thu", applications: 5, views: 15 },
    { name: "Fri", applications: 10, views: 30 },
    { name: "Sat", applications: 7, views: 20 },
    { name: "Sun", applications: 3, views: 10 },
  ];

  const recommendedJobs = [
    {
      id: 1,
      title: "UI/UX Designer",
      company: "TechStart Inc",
      location: "Remote",
      rate: "$45/hr",
      match: 95,
      type: "Part-time",
      posted: "2h ago",
    },
    {
      id: 2,
      title: "Frontend Developer",
      company: "CodeLab",
      location: "San Francisco",
      rate: "$50/hr",
      match: 92,
      type: "Contract",
      posted: "5h ago",
    },
    {
      id: 3,
      title: "Content Writer",
      company: "MediaHub",
      location: "New York",
      rate: "$35/hr",
      match: 88,
      type: "Freelance",
      posted: "1d ago",
    },
    {
      id: 4,
      title: "Data Analyst",
      company: "Analytics Pro",
      location: "Remote",
      rate: "$42/hr",
      match: 85,
      type: "Part-time",
      posted: "2d ago",
    },
  ];

  const stats = [
    {
      icon: Briefcase,
      label: "Active Applications",
      value: "12",
      change: "+3 this week",
      color: "text-primary",
    },
    {
      icon: TrendingUp,
      label: "Profile Views",
      value: "847",
      change: "+23% vs last week",
      color: "text-green-400",
    },
    {
      icon: Clock,
      label: "Hours Worked",
      value: "156",
      change: "+12 this month",
      color: "text-blue-400",
    },
    {
      icon: DollarSign,
      label: "Total Earned",
      value: "$4,280",
      change: "+$520 this month",
      color: "text-yellow-400",
    },
  ];

  const upcomingGigs = [
    {
      title: "Website Redesign",
      client: "Local Cafe",
      date: "May 26, 2026",
      time: "2:00 PM",
      payment: "$300",
    },
    {
      title: "Logo Design",
      client: "Startup XYZ",
      date: "May 28, 2026",
      time: "10:00 AM",
      payment: "$150",
    },
    {
      title: "Content Writing",
      client: "Blog Network",
      date: "May 30, 2026",
      time: "Flexible",
      payment: "$200",
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-32 md:pb-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Welcome back, Alex
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's what's happening with your gigs today
          </p>
        </motion.div>

        {/* Stats Grid */}
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
                initial={{ opacity: 0, scale: 0.9 }}
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
                <div className="text-sm text-muted-foreground mb-2">
                  {stat.label}
                </div>
                <div className="text-xs text-green-400">{stat.change}</div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Analytics Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold mb-1">
                  Activity Overview
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your weekly performance metrics
                </p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">
                This Week
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analyticsData}>
                <XAxis
                  dataKey="name"
                  stroke="#9CA3AF"
                  strokeWidth={0}
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  strokeWidth={0}
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#F5B700"
                  strokeWidth={3}
                  dot={{ fill: "#F5B700", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#FFD54A"
                  strokeWidth={2}
                  dot={{ fill: "#FFD54A", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-sm text-muted-foreground">
                  Applications
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-glow"></div>
                <span className="text-sm text-muted-foreground">
                  Profile Views
                </span>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Gigs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
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
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 smooth-transition cursor-pointer"
                >
                  <div className="font-semibold mb-1">{gig.title}</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {gig.client}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {gig.date} • {gig.time}
                    </span>
                    <span className="text-primary font-semibold">
                      {gig.payment}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">
                  AI-Powered Recommendations
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Perfect matches based on your skills and preferences
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                AI Matched
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="p-6 rounded-xl bg-muted/30 hover:bg-muted/50 smooth-transition cursor-pointer border border-border/50 hover:border-primary/30"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {job.company}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                    <Award className="w-3 h-3" />
                    {job.match}%
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-background/50 text-xs">
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-background/50 text-xs">
                    {job.type}
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                    <DollarSign className="w-3 h-3" />
                    {job.rate}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Posted {job.posted}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium smooth-transition hover:shadow-lg hover:shadow-primary/30"
                  >
                    Apply Now
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.02 }}
            className="w-full mt-6 py-4 rounded-xl glass hover:bg-muted/50 smooth-transition font-medium"
          >
            View All Recommendations
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}
