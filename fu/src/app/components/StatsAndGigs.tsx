import { motion } from "motion/react";
import { Sparkles, TrendingUp } from "lucide-react";

export default function StatsAndGigs() {
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
      tag: "",
      match: "89%",
    },
    {
      title: "Delivery Driver",
      tag: "",
      match: "87%",
    },
  ];

  const yourStats = {
    reputation: 4.9,
    completed: "$3,247",
    gigsDone: 34,
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Recommended Gigs + Your Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recommended Gigs - Browser Window Style */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 bg-card rounded-2xl overflow-hidden border border-border"
          >
            {/* Browser Top Bar */}
            <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Recommended Gigs</h3>
                <div className="flex items-center gap-2 text-primary text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Matched</span>
                </div>
              </div>

              <div className="space-y-4">
                {recommendedGigs.map((gig, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-primary"></div>
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {gig.title}
                          {gig.tag && (
                            <span className="px-2 py-1 bg-primary text-background text-xs rounded-full font-medium">
                              {gig.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-primary font-bold">{gig.match}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Your Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <h3 className="text-xl font-bold mb-6">Your Stats</h3>

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

            <div className="mt-6 p-4 bg-primary/10 rounded-xl">
              <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
                <TrendingUp className="w-4 h-4" />
                <span>AI Insights</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You're in the top 10% of workers this month!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
